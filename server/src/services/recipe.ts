import { storage } from '../../storage';
import { SpoonacularService } from './spoonacular';


// Create a new instance of the Spoonacular service for external API calls
const spoonacularService = new SpoonacularService();

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
  instructions: string;
  extendedIngredients: {
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

export class RecipeService {
  /**
   * Search for recipes with detailed parameters
   */
  async searchRecipes(params: RecipeSearchParams): Promise<RecipeDetails[]> {
    try {
      return await storage.searchRecipes(params);
    } catch (error: any) {
      console.error('Recipe search error:', error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information by ID
   */
  async getRecipeById(id: number): Promise<RecipeDetails> {
    try {
      if (!id) {
        console.warn(`Invalid recipe ID: ${id}, creating placeholder`);
        return this.createFallbackRecipe(id, 'Invalid recipe ID');
      }
      
      // First, try to get the recipe from our cache
      const cachedRecipe = await storage.getRecipeFromCache(id.toString());
      if (cachedRecipe) {
        console.log(`Using cached recipe data for id ${id}`);
        return cachedRecipe.data as unknown as RecipeDetails;
      }
      
      // If not in cache, try our database
      let recipe = await storage.getRecipeById(id);
      
      if (!recipe) {
        console.warn(`Recipe with ID ${id} not found in database, trying Spoonacular`);
        
        // Enforce 6-digit recipe ID format using Spoonacular service for external API calls
        try {
          recipe = await spoonacularService.getRecipeById(id);
        } catch (error) {
          console.error(`Failed to fetch recipe with ID ${id}:`, error);
          return this.createFallbackRecipe(id, 'Recipe not found in Spoonacular');
        }
      }
      
      return recipe;
    } catch (error: any) {
      console.error(`Recipe fetch error for ID ${id}:`, error);
      return this.createFallbackRecipe(id, 'Error fetching recipe details');
    }
  }

  /**
   * Get random recipes that match certain criteria
   */
  async getRandomRecipes(params: { 
    number?: number;
    tags?: string[];
    diet?: string;
  } = {}): Promise<RecipeDetails[]> {
    try {
      return await storage.getRandomRecipes(params);
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      return [];
    }
  }

  /**
   * Generate a shopping list from a meal plan
   */
  async generateShoppingList(recipeIds: number[]): Promise<any[]> {
    try {
      // Collect all ingredients from recipes
      const ingredients: any[] = [];
      const failedRecipes: number[] = [];
      
      for (const id of recipeIds) {
        try {
          const recipe = await this.getRecipeById(id);
          if (recipe.extendedIngredients?.length) {
            ingredients.push(...recipe.extendedIngredients.map(ingredient => ({
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              category: ingredient.aisle
            })));
          } else {
            console.warn(`Recipe ${id} has no ingredients`);
            failedRecipes.push(id);
          }
        } catch (error) {
          console.error(`Failed to get ingredients for recipe ${id}:`, error);
          failedRecipes.push(id);
          continue;
        }
      }

      if (ingredients.length === 0 && failedRecipes.length > 0) {
        return [{
          name: "Couldn't retrieve ingredients",
          amount: 1,
          unit: "",
          category: "Other",
          note: `Failed to retrieve ingredients for ${failedRecipes.length} recipes. Please try again later.`
        }];
      }

      // Group similar ingredients
      const groupedIngredients = this.groupSimilarIngredients(ingredients);
      
      // If there were some failed recipes but we still have ingredients, add a note
      if (failedRecipes.length > 0) {
        groupedIngredients.push({
          name: "Note",
          amount: 1,
          unit: "",
          category: "Other",
          note: `Failed to retrieve ingredients for ${failedRecipes.length} recipes. This shopping list may be incomplete.`
        });
      }
      
      return groupedIngredients;
    } catch (error: any) {
      console.error('Shopping list generation error:', error);
      
      return [{
        name: "Error generating shopping list",
        amount: 1,
        unit: "",
        category: "Other",
        note: "There was an error generating your shopping list. Please try again later."
      }];
    }
  }

  /**
   * Creates a fallback recipe when the requested recipe cannot be found
   */
  private createFallbackRecipe(id: number, reason: string): RecipeDetails {
    return {
      id: id || 999999,
      title: `Recipe ${id} (Unavailable)`,
      image: 'https://placehold.co/600x400/gray/white?text=Recipe+Unavailable',
      readyInMinutes: 0,
      servings: 1,
      instructions: `Recipe details are unavailable. Reason: ${reason}`,
      nutrition: { nutrients: [] },
      extendedIngredients: [],
      sourceName: 'Unknown',
      diets: []
    };
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
      category: ingredient.category,
      note: ingredient.note
    }));
  }
}