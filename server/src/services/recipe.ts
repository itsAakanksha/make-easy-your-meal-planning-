import { getRecipeInformation, searchRecipes as searchSpoonacularRecipes, generateMealPlan as generateSpoonacularMealPlan, getRecipeInformationBulk } from '../utils/spoonacular.client';

export interface RecipeSearchParams {
  query?: string;
  diet?: string;
  cuisines?: string[];
  excludeIngredients?: string[];
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
  number?: number;
}

export interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  nutrition: {
    nutrients: {
      name: string;
      amount: number;
      unit: string;
    }[];
  };
  instructions?: string;
  extendedIngredients?: {
    id: number;
    name: string;
    amount: number;
    unit: string;
    aisle: string;
  }[];
  sourceUrl?: string;
  sourceName?: string;
  creditsText?: string;
  diets?: string[];
}

// Interfaces for Spoonacular API responses
export interface SpoonacularMeal {
  id: number;
  title: string;
  slot?: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
}

export interface SpoonacularDayPlan {
  meals: Record<string, SpoonacularMeal | null>;
}

export interface SpoonacularWeekPlan {
  week: Record<string, SpoonacularDayPlan>;
}

export interface SpoonacularMealPlanResponse {
  meals?: SpoonacularMeal[];
  week?: Record<string, SpoonacularDayPlan>;
}

export class RecipeService {
  /**
   * Search for recipes with detailed parameters - always use Spoonacular API
   */
  async searchRecipes(params: RecipeSearchParams): Promise<RecipeDetails[]> {
    try {
      return await searchSpoonacularRecipes(params);
    } catch (error: any) {
      console.error('Recipe search error:', error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information by ID
   * @param id The recipe ID
   * @param bypassCache Whether to bypass the cache and force a fresh fetch from Spoonacular
   */
  async getRecipeById(id: number, bypassCache = false): Promise<RecipeDetails> {
    try {
      if (!id) {
        console.warn(`Invalid recipe ID: ${id}`);
        throw new Error('Invalid recipe ID');
      }

      // If not in cache or bypassing cache, fetch from Spoonacular
      console.log(`Fetching recipe with ID ${id} from Spoonacular API`);
      try {
        const recipe = await getRecipeInformation(id, bypassCache);
        return recipe as unknown as RecipeDetails;
      } catch (error) {
        console.error(`Failed to fetch recipe with ID ${id} from Spoonacular:`, error);
        throw error;
      }
    } catch (error: any) {
      console.error(`Recipe fetch error for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generate a meal plan using Spoonacular API
   */
  async generateMealPlan(params: {
    timeFrame: 'day' | 'week';
    targetCalories?: number;
    diet?: string;
    exclude?: string[];
  }): Promise<SpoonacularMealPlanResponse> {
    try {
      console.log("Generating fresh meal plan from Spoonacular with params:", params);
      
      // Generate meal plan using Spoonacular
      const response = await generateSpoonacularMealPlan(params);
      
      // Validate response
      if (!response || (!response.meals && !response.week)) {
        console.error("Invalid response from Spoonacular:", response);
        throw new Error("Invalid response from Spoonacular API");
      }
      
      // Log success for debugging
      if (response.meals) {
        console.log(`Successfully generated day meal plan with ${response.meals.length} meals`);
      } else if (response.week) {
        console.log("Successfully generated week meal plan");
      }
      
      return response;
    } catch (error) {
      console.error('Error generating meal plan with Spoonacular:', error);
      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }

  /**
   * Generate a shopping list from recipes in a meal plan
   */
  async generateShoppingList(recipeIds: number[]): Promise<any[]> {
    try {
      // Collect all ingredients from recipes
      const ingredients: any[] = [];
      const failedRecipes: number[] = [];
      
      try {
        // Get fresh recipe data from Spoonacular to ensure accurate ingredient list
        const recipes = await getRecipeInformationBulk(recipeIds);
        
        recipes.forEach((recipe: RecipeDetails) => {
          if (recipe.extendedIngredients?.length) {
            ingredients.push(...recipe.extendedIngredients.map((ingredient: { 
              name: string;
              amount: number;
              unit: string;
              aisle?: string;
            }) => ({
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              category: ingredient.aisle || 'Other'
            })));
          } else {
            console.warn(`Recipe ${recipe.id} has no ingredients`);
            failedRecipes.push(recipe.id);
          }
        });
      } catch (error) {
        console.error(`Failed to get ingredients for recipes:`, error);
        throw error;
      }

      if (ingredients.length === 0) {
        throw new Error("No ingredients found for shopping list");
      }

      // Group similar ingredients
      return this.groupSimilarIngredients(ingredients);
    } catch (error: any) {
      console.error('Shopping list generation error:', error);
      throw error;
    }
  }

  /**
   * Helper method to group similar ingredients
   */
  private groupSimilarIngredients(ingredients: any[]): any[] {
    const groupedMap = new Map<string, any>();
    
    for (const ingredient of ingredients) {
      const key = ingredient.name.toLowerCase();
      const unitKey = `${key}__${ingredient.unit}`; // Create composite key with unit
      
      if (groupedMap.has(unitKey)) {
        // Same ingredient and unit - combine amounts
        const existing = groupedMap.get(unitKey);
        existing.amount += ingredient.amount;
      } else if (groupedMap.has(key)) {
        // Same ingredient but different unit - keep separate with unit in name
        const newKey = `${key} (${ingredient.unit})`;
        groupedMap.set(newKey, { ...ingredient });
      } else {
        // New ingredient
        groupedMap.set(unitKey, { ...ingredient });
      }
    }

    // Clean up the keys before returning
    return Array.from(groupedMap.values()).map(ingredient => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      category: ingredient.category
    }));
  }
}