/**
 * Meal planning algorithm for intelligent recipe selection
 * Implements rule-based selection and optimization for meal plans
 */

import { BadRequestError } from './error.classes';
import * as spoonacularClient from './spoonacular.client';

// Types for our algorithm
interface MealPlanConstraints {
  diet?: string;
  allergies?: string[];
  dislikes?: string[];
  maxReadyTime?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  budgetPerMeal?: number;
  servings?: number;
}

// Interface for recipe data
interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  diets?: string[];
  dishTypes?: string[];
  cuisines?: string[];
}

// Interface for meal preferences
interface MealPreferences {
  diet?: string;
  allergies?: string[];
  targetCalories?: number;
  mealCount: number;
  maxPrepTime?: number;
  timeFrame: 'day' | 'week';
}

// Interface for a recipe assigned to a meal slot
interface SelectedMeal extends Recipe {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
}

// Map frontend diet terms to Spoonacular API values
// This helps ensure we're using the correct terms when filtering
const dietMappings: Record<string, string> = {
  'balanced': 'balanced',
  'vegetarian': 'vegetarian',
  'vegan': 'vegan',
  'paleo': 'paleo',
  'ketogenic': 'ketogenic',
  'gluten-free': 'gluten free',
  'pescetarian': 'pescatarian', // Spoonacular uses this spelling
  'whole30': 'whole 30',
  // Add any other mappings as needed
};

/**
 * Selects the best recipes to include in a meal plan based on user preferences and nutritional goals
 */
export async function selectMeals(
  candidateRecipes: Recipe[],
  preferences: MealPreferences,
  timeFrame: 'day' | 'week'
): Promise<SelectedMeal[]> {
  console.log(`Starting meal selection for ${timeFrame} plan with ${candidateRecipes.length} candidates`);
  console.log(`Diet preference: ${preferences.diet || 'none'}`);
  
  // If we have fewer than expected recipes, try to get more with a fallback strategy
  if (candidateRecipes.length < preferences.mealCount * 3) {
    console.log(`Not enough candidate recipes (${candidateRecipes.length}). Attempting to fetch more...`);
    try {
      // First, try getting more recipes with same diet but different parameters
      const moreRecipes = await spoonacularClient.searchRecipes({
        number: preferences.mealCount * 5,
        diet: preferences.diet,
        maxReadyTime: preferences.maxPrepTime ? preferences.maxPrepTime * 1.5 : undefined // Allow slightly longer prep time
      });
      
      // If that still doesn't give us enough, try without diet restriction
      if ((candidateRecipes.length + moreRecipes.length) < preferences.mealCount * 3) {
        console.log(`Still not enough recipes, trying without diet restriction`);
        const fallbackRecipes = await spoonacularClient.searchRecipes({
          number: preferences.mealCount * 5,
          maxReadyTime: preferences.maxPrepTime
        });
        
        // Add these recipes to our candidate pool
        const existingIds = new Set(candidateRecipes.map(r => r.id));
        for (const recipe of fallbackRecipes) {
          if (!existingIds.has(recipe.id)) {
            candidateRecipes.push(recipe);
            existingIds.add(recipe.id);
          }
        }
      }
      
      // Add the first batch of recipes if they're not duplicates
      const existingIds = new Set(candidateRecipes.map(r => r.id));
      for (const recipe of moreRecipes) {
        if (!existingIds.has(recipe.id)) {
          candidateRecipes.push(recipe);
          existingIds.add(recipe.id);
        }
      }
      
      console.log(`Added more recipes. Now have ${candidateRecipes.length} candidates.`);
    } catch (error) {
      console.error("Error fetching more recipes:", error);
    }
  }
  
  if (candidateRecipes.length === 0) {
    console.error("No candidate recipes available after all attempts");
    throw new Error("Could not find any suitable recipes. Please try again or adjust your preferences.");
  }
  
  // Create deep copy of recipes to avoid modifying originals
  const recipes = JSON.parse(JSON.stringify(candidateRecipes)) as Recipe[];
  
  // Log diet information of first 5 recipes to help debug
  const sampleRecipes = recipes.slice(0, 5);
  console.log("Diet information for sample recipes:");
  sampleRecipes.forEach(recipe => {
    console.log(`Recipe ${recipe.id} (${recipe.title}): Diets = ${recipe.diets?.join(', ') || 'none'}`);
  });
  
  // Apply filters
  const filteredRecipes = filterRecipesByConstraints(recipes, preferences);
  console.log(`After filtering, ${filteredRecipes.length} recipes remain`);
  
  if (filteredRecipes.length < preferences.mealCount) {
    // Try again with more lenient filtering if we got too few results
    console.log("Too few recipes match constraints. Trying with more lenient filtering...");
    const lenientFiltered = recipes.filter(recipe => {
      // Skip diet filtering entirely in lenient mode
      // Only apply preparation time filter with 50% extra allowance
      if (preferences.maxPrepTime && recipe.readyInMinutes > preferences.maxPrepTime * 1.5) {
        return false;
      }
      return true;
    });
    
    console.log(`Found ${lenientFiltered.length} recipes with lenient filtering.`);
    
    // Use all available recipes if we're still below minimum
    if (lenientFiltered.length < preferences.mealCount) {
      console.warn("Not enough recipes even with lenient filtering. Using all available recipes.");
      // Use original candidates as a last resort
      filteredRecipes.length = 0; // Clear the array
      filteredRecipes.push(...recipes);
    } else {
      // Otherwise use the lenient filtered recipes
      filteredRecipes.length = 0; // Clear the array
      filteredRecipes.push(...lenientFiltered);
    }
  }
  
  // Sort recipes into meal type buckets based on their characteristics
  const mealBuckets = categorizeMealsByType(filteredRecipes);
  
  // Create days array (1 day for daily plan, 7 days for weekly plan)
  const numberOfDays = timeFrame === 'day' ? 1 : 7;
  const today = new Date();
  
  // Array to hold the final selected meals
  const selectedMeals: SelectedMeal[] = [];
  
  // For each day in the plan
  for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
    // Calculate the date for this day
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayIndex);
    const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Daily nutrition tracking
    const dailyNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    const dailyTargetCalories = preferences.targetCalories || 2000;
    const caloriesPerMeal = dailyTargetCalories / preferences.mealCount;
    
    // Meal types to include based on meal count
    const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = [];
    
    // Always include main meals first
    if (preferences.mealCount >= 1) mealTypes.push('breakfast');
    if (preferences.mealCount >= 2) mealTypes.push('lunch');
    if (preferences.mealCount >= 3) mealTypes.push('dinner');
    
    // Add snacks for higher meal counts
    if (preferences.mealCount === 4) mealTypes.push('snack');
    if (preferences.mealCount === 5) {
      mealTypes.push('snack');
      mealTypes.push('snack');
    }
    
    // For each meal type in this day
    for (const mealType of mealTypes) {
      // Get appropriate bucket for this meal type
      const bucket = mealType === 'breakfast' ? mealBuckets.breakfast :
                     mealType === 'lunch' ? mealBuckets.lunch :
                     mealType === 'dinner' ? mealBuckets.dinner :
                     mealBuckets.snack;
      
      if (bucket.length === 0) {
        console.warn(`No recipes available for ${mealType}. Using general pool.`);
        // Fall back to general pool if specific bucket is empty
        bucket.push(...filteredRecipes.filter(r => !selectedMeals.some(sm => sm.id === r.id)));
      }
      
      // Skip if no recipes available
      if (bucket.length === 0) {
        console.warn(`No recipes available for ${mealType} even from general pool.`);
        continue;
      }
      
      // Calculate target calories for this meal
      const targetMealCalories = mealType === 'snack' ? caloriesPerMeal / 2 : caloriesPerMeal;
      
      // Select the best recipe for this meal slot
      const selected = selectBestRecipeForMeal(
        bucket,
        mealType,
        targetMealCalories,
        dailyNutrition,
        selectedMeals.map(m => m.id) // Already selected recipe IDs
      );
      
      if (selected) {
        // Add nutritional data to daily tracking
        updateNutritionTotals(selected, dailyNutrition);
        
        // Add to selected meals
        selectedMeals.push({
          ...selected,
          mealType,
          date: dateString
        });
        
        // Remove this recipe from all buckets to avoid duplication
        removeRecipeFromBuckets(selected.id, mealBuckets);
      }
    }
  }
  
  return selectedMeals;
}

/**
 * Filter recipes based on user constraints
 */
function filterRecipesByConstraints(recipes: Recipe[], preferences: MealPreferences): Recipe[] {
  // Map the user's diet preference to the expected Spoonacular format
  const dietPreference = preferences.diet ? 
    (dietMappings[preferences.diet.toLowerCase()] || preferences.diet) : undefined;
  
  console.log(`Filtering with diet preference: ${dietPreference || 'none'}`);
  
  return recipes.filter(recipe => {
    // If we have a diet preference and the recipe has diet data
    if (dietPreference && dietPreference !== 'none' && recipe.diets) {
      const recipeDiets = recipe.diets.map(d => d.toLowerCase());
      
      // Special case handling for common diets to ensure proper matching
      if (dietPreference === 'vegetarian') {
        // For vegetarian, check if any of the diets contain vegetarian or vegan
        if (!recipeDiets.some(diet => 
            diet.includes('vegetarian') || diet === 'vegan')) {
          return false;
        }
      } 
      else if (dietPreference === 'vegan') {
        // For vegan, must explicitly have 'vegan' diet
        if (!recipeDiets.includes('vegan')) {
          return false;
        }
      }
      else if (dietPreference === 'gluten free') {
        // For gluten-free, check variations
        if (!recipeDiets.some(diet => 
            diet.includes('gluten free') || diet.includes('gluten-free'))) {
          return false;
        }
      }
      else {
        // For other diets, use fuzzy matching
        const normalizedDiet = dietPreference.toLowerCase().replace(/[-\s]/g, '');
        
        // Check if any of the recipe's diets match our preference
        if (!recipeDiets.some(diet => {
          const normalizedRecipeDiet = diet.replace(/[-\s]/g, '');
          return normalizedRecipeDiet.includes(normalizedDiet) || 
                 normalizedDiet.includes(normalizedRecipeDiet);
        })) {
          return false;
        }
      }
    }
    
    // Check preparation time
    if (preferences.maxPrepTime && recipe.readyInMinutes > preferences.maxPrepTime) {
      return false;
    }
    
    // Recipe passes all filters
    return true;
  });
}

/**
 * Categorize recipes into breakfast, lunch, dinner, and snack buckets
 */
function categorizeMealsByType(recipes: Recipe[]): {
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
  snack: Recipe[];
} {
  // Create a copy of the recipes array and shuffle it to increase variety
  const shuffledRecipes = [...recipes];
  for (let i = shuffledRecipes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledRecipes[i], shuffledRecipes[j]] = [shuffledRecipes[j], shuffledRecipes[i]];
  }

  const buckets = {
    breakfast: [] as Recipe[],
    lunch: [] as Recipe[],
    dinner: [] as Recipe[],
    snack: [] as Recipe[]
  };
  
  // First pass: use dish types for categorization
  shuffledRecipes.forEach(recipe => {
    if (recipe.dishTypes && recipe.dishTypes.length > 0) {
      const dishTypes = recipe.dishTypes.map(t => t.toLowerCase());
      
      if (dishTypes.some(t => t.includes('breakfast') || t.includes('lunch') || t.includes('morning meal'))) {
        buckets.breakfast.push(recipe);
        return;
      }
      if (dishTypes.some(t => t.includes('lunch') || t.includes('main course') || t.includes('main dish'))) {
        buckets.lunch.push(recipe);
        return;
      }
      if (dishTypes.some(t => t.includes('dinner') || t.includes('main course') || t.includes('main dish'))) {
        buckets.dinner.push(recipe);
        return;
      }
      if (dishTypes.some(t => 
        t.includes('snack') || 
        t.includes('appetizer') || 
        t.includes('side dish') ||
        t.includes('dessert')
      )) {
        buckets.snack.push(recipe);
        return;
      }
    }
  });
  
  // Second pass: distribute uncategorized recipes based on heuristics
  const uncategorized = shuffledRecipes.filter(recipe => {
    return !(
      buckets.breakfast.some(r => r.id === recipe.id) ||
      buckets.lunch.some(r => r.id === recipe.id) ||
      buckets.dinner.some(r => r.id === recipe.id) ||
      buckets.snack.some(r => r.id === recipe.id)
    );
  });
  
  uncategorized.forEach(recipe => {
    if (recipe.readyInMinutes <= 15) {
      // Quick recipes are likely breakfast or snacks
      if (buckets.breakfast.length <= buckets.snack.length) {
        buckets.breakfast.push(recipe);
      } else {
        buckets.snack.push(recipe);
      }
    } else if (recipe.readyInMinutes <= 30) {
      // Medium-time recipes could be lunch
      buckets.lunch.push(recipe);
    } else {
      // Longer recipes are likely dinner
      buckets.dinner.push(recipe);
    }
  });
  
  // Ensure we have recipes in each bucket
  const ensureMinimumInBucket = (bucketName: 'breakfast' | 'lunch' | 'dinner' | 'snack', minCount: number) => {
    if (buckets[bucketName].length < minCount) {
      const neededCount = minCount - buckets[bucketName].length;
      
      // Find which buckets have excess recipes we can borrow from
      const otherBuckets = ['breakfast', 'lunch', 'dinner', 'snack'].filter(b => b !== bucketName) as Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>;
      
      // Sort other buckets by size (largest first)
      otherBuckets.sort((a, b) => buckets[b].length - buckets[a].length);
      
      // Try to take from largest bucket
      let taken = 0;
      for (const bucket of otherBuckets) {
        while (buckets[bucket].length > minCount && taken < neededCount) {
          // Take a random recipe from this bucket
          const randomIndex = Math.floor(Math.random() * buckets[bucket].length);
          const recipe = buckets[bucket][randomIndex];
          
          // Remove from source bucket and add to target bucket
          buckets[bucket].splice(randomIndex, 1);
          buckets[bucketName].push(recipe);
          taken++;
          
          if (taken >= neededCount) break;
        }
        
        if (taken >= neededCount) break;
      }
    }
  };
  
  // Try to ensure at least 3 recipes in each bucket
  ensureMinimumInBucket('breakfast', 3);
  ensureMinimumInBucket('lunch', 3);
  ensureMinimumInBucket('dinner', 3);
  ensureMinimumInBucket('snack', 3);
  
  // If any bucket is still empty, use any remaining recipes
  const remainingRecipes = shuffledRecipes.filter(recipe => {
    return !(
      buckets.breakfast.some(r => r.id === recipe.id) ||
      buckets.lunch.some(r => r.id === recipe.id) ||
      buckets.dinner.some(r => r.id === recipe.id) ||
      buckets.snack.some(r => r.id === recipe.id)
    );
  });
  
  if (buckets.breakfast.length === 0 && remainingRecipes.length > 0) {
    buckets.breakfast.push(...remainingRecipes.slice(0, Math.min(3, remainingRecipes.length)));
  }
  
  if (buckets.lunch.length === 0 && remainingRecipes.length > 3) {
    buckets.lunch.push(...remainingRecipes.slice(3, Math.min(6, remainingRecipes.length)));
  }
  
  if (buckets.dinner.length === 0 && remainingRecipes.length > 6) {
    buckets.dinner.push(...remainingRecipes.slice(6, Math.min(9, remainingRecipes.length)));
  }
  
  if (buckets.snack.length === 0 && remainingRecipes.length > 9) {
    buckets.snack.push(...remainingRecipes.slice(9));
  }
  
  console.log(`Categorized recipes: Breakfast=${buckets.breakfast.length}, Lunch=${buckets.lunch.length}, Dinner=${buckets.dinner.length}, Snack=${buckets.snack.length}`);
  
  return buckets;
}

/**
 * Select the best recipe for a specific meal slot based on nutritional needs
 */
function selectBestRecipeForMeal(
  candidates: Recipe[],
  mealType: string,
  targetCalories: number,
  currentNutrition: { calories: number; protein: number; carbs: number; fat: number },
  alreadySelectedIds: number[]
): Recipe | null {
  // Filter out already selected recipes
  const available = candidates.filter(r => !alreadySelectedIds.includes(r.id));
  
  if (available.length === 0) return null;
  
  // Create a scoring function
  const scoreRecipe = (recipe: Recipe): number => {
    // Get calories from recipe
    const caloriesInRecipe = getCaloriesFromRecipe(recipe);
    
    // Score based on how close it is to target calories (0-1 scale)
    const calorieScore = 1 - Math.min(1, Math.abs(caloriesInRecipe - targetCalories) / targetCalories);
    
    // Add some randomness to increase variety (0-0.2 scale)
    const randomness = Math.random() * 0.2;
    
    return calorieScore + randomness;
  };
  
  // Sort by score (highest first)
  const scored = available
    .map(recipe => ({ recipe, score: scoreRecipe(recipe) }))
    .sort((a, b) => b.score - a.score);
  
  // Return the best match
  return scored[0]?.recipe || null;
}

/**
 * Get calories from recipe nutrition data
 */
function getCaloriesFromRecipe(recipe: Recipe): number {
  if (recipe.nutrition && recipe.nutrition.nutrients) {
    const calories = recipe.nutrition.nutrients.find(n => 
      n.name.toLowerCase() === 'calories' || 
      n.name.toLowerCase() === 'energy'
    );
    if (calories) {
      return calories.amount;
    }
  }
  
  // Fallback estimates if nutrition data is missing
  if (recipe.dishTypes) {
    if (recipe.dishTypes.some(t => t.includes('breakfast'))) return 400;
    if (recipe.dishTypes.some(t => t.includes('lunch'))) return 600;
    if (recipe.dishTypes.some(t => t.includes('dinner'))) return 700;
    if (recipe.dishTypes.some(t => t.includes('snack'))) return 200;
  }
  
  // Very rough estimate based on meal type
  return recipe.readyInMinutes * 10; // Simple heuristic
}

/**
 * Update daily nutrition totals with a selected recipe
 */
function updateNutritionTotals(
  recipe: Recipe,
  nutritionTotals: { calories: number; protein: number; carbs: number; fat: number }
): void {
  if (recipe.nutrition && recipe.nutrition.nutrients) {
    // Find each nutrient and add to totals
    recipe.nutrition.nutrients.forEach(nutrient => {
      const name = nutrient.name.toLowerCase();
      if (name === 'calories' || name === 'energy') {
        nutritionTotals.calories += nutrient.amount;
      } else if (name === 'protein') {
        nutritionTotals.protein += nutrient.amount;
      } else if (['carbohydrates', 'carbs'].includes(name)) {
        nutritionTotals.carbs += nutrient.amount;
      } else if (name === 'fat') {
        nutritionTotals.fat += nutrient.amount;
      }
    });
  } else {
    // Fallback if nutrition data is missing
    nutritionTotals.calories += getCaloriesFromRecipe(recipe);
    // We can't accurately estimate macros without data
  }
}

/**
 * Remove a recipe from all buckets to prevent duplication
 */
function removeRecipeFromBuckets(
  recipeId: number,
  buckets: { breakfast: Recipe[]; lunch: Recipe[]; dinner: Recipe[]; snack: Recipe[] }
): void {
  buckets.breakfast = buckets.breakfast.filter(r => r.id !== recipeId);
  buckets.lunch = buckets.lunch.filter(r => r.id !== recipeId);
  buckets.dinner = buckets.dinner.filter(r => r.id !== recipeId);
  buckets.snack = buckets.snack.filter(r => r.id !== recipeId);
}