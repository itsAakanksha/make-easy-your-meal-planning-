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

/**
 * Selects the best recipes to include in a meal plan based on user preferences and nutritional goals
 */
export async function selectMeals(
  candidateRecipes: Recipe[],
  preferences: MealPreferences,
  timeFrame: 'day' | 'week'
): Promise<SelectedMeal[]> {
  console.log(`Starting meal selection for ${timeFrame} plan with ${candidateRecipes.length} candidates`);
  
  // Create deep copy of recipes to avoid modifying originals
  const recipes = JSON.parse(JSON.stringify(candidateRecipes)) as Recipe[];
  
  // Apply strict filters
  const filteredRecipes = filterRecipesByConstraints(recipes, preferences);
  console.log(`After filtering, ${filteredRecipes.length} recipes remain`);
  
  if (filteredRecipes.length === 0) {
    throw new Error('No recipes match your constraints. Try relaxing some filters.');
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
  return recipes.filter(recipe => {
    // Check dietary restrictions
    if (preferences.diet && preferences.diet !== 'none') {
      // For vegetarian, vegan, etc.
      if (!recipe.diets || !recipe.diets.includes(preferences.diet.toLowerCase())) {
        return false;
      }
    }
    
    // Check preparation time
    if (preferences.maxPrepTime && recipe.readyInMinutes > preferences.maxPrepTime) {
      return false;
    }
    
    // More filters can be added here (allergies would be handled at API level already)
    
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
  const buckets = {
    breakfast: [] as Recipe[],
    lunch: [] as Recipe[],
    dinner: [] as Recipe[],
    snack: [] as Recipe[]
  };
  
  recipes.forEach(recipe => {
    // Use dish types to categorize
    if (recipe.dishTypes && recipe.dishTypes.length > 0) {
      if (recipe.dishTypes.some(t => t.includes('breakfast'))) {
        buckets.breakfast.push(recipe);
        return;
      }
      if (recipe.dishTypes.some(t => t.includes('lunch'))) {
        buckets.lunch.push(recipe);
        return;
      }
      if (recipe.dishTypes.some(t => t.includes('dinner') || t.includes('main course'))) {
        buckets.dinner.push(recipe);
        return;
      }
      if (recipe.dishTypes.some(t => 
        t.includes('snack') || 
        t.includes('appetizer') || 
        t.includes('side dish')
      )) {
        buckets.snack.push(recipe);
        return;
      }
    }
    
    // If dish types don't help, use heuristics
    if (recipe.readyInMinutes <= 15) {
      // Quick recipes could be breakfast or snacks
      buckets.breakfast.push(recipe);
      buckets.snack.push(recipe);
    } else if (recipe.readyInMinutes <= 30) {
      // Medium-time recipes could be lunch
      buckets.lunch.push(recipe);
    } else {
      // Longer recipes are likely dinner
      buckets.dinner.push(recipe);
    }
  });
  
  // Ensure we have recipes in each bucket
  if (buckets.breakfast.length === 0) {
    // Fall back to meals with shorter prep times
    buckets.breakfast = recipes
      .filter(r => r.readyInMinutes <= 20)
      .sort((a, b) => a.readyInMinutes - b.readyInMinutes)
      .slice(0, 10);
  }
  
  if (buckets.lunch.length === 0) {
    buckets.lunch = recipes
      .sort((a, b) => a.readyInMinutes - b.readyInMinutes)
      .slice(0, 10);
  }
  
  if (buckets.dinner.length === 0) {
    buckets.dinner = recipes
      .sort((a, b) => b.readyInMinutes - a.readyInMinutes) // Longer prep times for dinner
      .slice(0, 10);
  }
  
  if (buckets.snack.length === 0) {
    buckets.snack = recipes
      .filter(r => r.readyInMinutes <= 15)
      .sort((a, b) => a.readyInMinutes - b.readyInMinutes)
      .slice(0, 10);
  }
  
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
    
    // Score based on how close it is to target calories
    const calorieScore = 1 - Math.min(1, Math.abs(caloriesInRecipe - targetCalories) / targetCalories);
    
    // Add variety and other factors to score
    // More complex scoring could consider macronutrient balance, etc.
    
    return calorieScore;
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
    const calories = recipe.nutrition.nutrients.find(n => n.name.toLowerCase() === 'calories');
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
      if (nutrient.name.toLowerCase() === 'calories') {
        nutritionTotals.calories += nutrient.amount;
      } else if (nutrient.name.toLowerCase() === 'protein') {
        nutritionTotals.protein += nutrient.amount;
      } else if (['carbohydrates', 'carbs'].includes(nutrient.name.toLowerCase())) {
        nutritionTotals.carbs += nutrient.amount;
      } else if (nutrient.name.toLowerCase() === 'fat') {
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