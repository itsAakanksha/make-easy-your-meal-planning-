import dotenv from 'dotenv';
import { storage } from '../../storage';

dotenv.config();

// Check if required environment variables are set
const spoonacularApiKey = process.env.SPOONACULAR_API_KEY;
if (!spoonacularApiKey) {
  console.error('Warning: SPOONACULAR_API_KEY is not set in environment variables');
}

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

export class SpoonacularService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.spoonacular.com';

  constructor() {
    this.apiKey = spoonacularApiKey || '';
    
    // Validate API key at initialization
    if (!this.apiKey) {
      console.error('ERROR: Spoonacular API key is missing. Recipe functionality will not work.');
    }
  }

  /**
   * Normalize recipe ID to ensure consistent 6-digit format
   */
  private normalizeRecipeId(id: string | number): number {
    // Convert to string for easier manipulation
    const idStr = String(id);
    
    // Handle spoonacular_1234567 format
    const match = typeof id === 'string' ? id.match(/spoonacular_(\d+)/) : null;
    if (match) {
      return this.validateRecipeId(parseInt(match[1], 10));
    }

    // Handle plain numeric ID
    const numericId = parseInt(idStr, 10);
    return this.validateRecipeId(numericId);
  }

  /**
   * Validate and correct recipe ID to ensure it's a valid 6-digit Spoonacular ID
   */
  private validateRecipeId(id: number): number {
    if (isNaN(id) || id <= 0) {
      console.warn(`Invalid recipe ID: ${id}, using fallback ID`);
      return 716429; // Return a valid default ID as fallback
    }
    
    // Convert to string to check length
    const idStr = String(id);
    
    // If it's a 7-digit ID, try removing the first digit (common pattern)
    if (idStr.length === 7) {
      return parseInt(idStr.substring(1), 10);
    }
    
    // If it's too short (less than 6 digits), pad with leading 7's to make it valid
    if (idStr.length < 6) {
      return parseInt('7'.repeat(6 - idStr.length) + idStr, 10);
    }
    
    // If it's longer than 7 digits, truncate to last 6 digits
    if (idStr.length > 7) {
      return parseInt(idStr.substring(idStr.length - 6), 10);
    }
    
    // Return as is if it's already 6 digits
    return id;
  }

  /**
   * Search for recipes with detailed parameters
   */
  async searchRecipes(params: RecipeSearchParams): Promise<any[]> {
    try {
      // Build query parameters
      const queryParams: Record<string, string> = {
        apiKey: this.apiKey,
        addRecipeInformation: 'true',
        includeNutrition: 'true',
        number: String(params.number || 10)
      };

      // Add optional parameters
      if (params.query) queryParams.query = params.query;
      if (params.diet && params.diet !== 'any') queryParams.diet = params.diet;
      if (params.cuisines?.length) queryParams.cuisine = params.cuisines.join(',');
      if (params.excludeIngredients?.length) queryParams.excludeIngredients = params.excludeIngredients.join(',');
      if (params.maxReadyTime) queryParams.maxReadyTime = String(params.maxReadyTime);
      if (params.minCalories) queryParams.minCalories = String(params.minCalories);
      if (params.maxCalories) queryParams.maxCalories = String(params.maxCalories);
      if (params.minProtein) queryParams.minProtein = String(params.minProtein);
      if (params.maxProtein) queryParams.maxProtein = String(params.maxProtein);
      if (params.minCarbs) queryParams.minCarbs = String(params.minCarbs);
      if (params.maxCarbs) queryParams.maxCarbs = String(params.maxCarbs);
      if (params.minFat) queryParams.minFat = String(params.minFat);
      if (params.maxFat) queryParams.maxFat = String(params.maxFat);

      // Build query string
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      // Make the API request
      const response = await fetch(`${this.baseUrl}/recipes/complexSearch?${queryString}`);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        const errorText = await response.text();
        throw new Error(`Spoonacular API error: ${errorText}`);
      }

      const data = await response.json();

      if (!data.results) {
        throw new Error('Invalid response from Spoonacular API');
      }

      // Extract just the necessary recipe data
      return data.results.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        nutrition: recipe.nutrition || { nutrients: [] },
        instructions: recipe.instructions || '',
        extendedIngredients: recipe.extendedIngredients || []
      }));
    } catch (error: any) {
      console.error('Recipe search error:', error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information by ID
   * Checks the cache first before making an API call
   */
  async getRecipeById(id: string | number): Promise<RecipeDetails> {
    try {
      // Check if ID is null or invalid
      if (!id || id === 'null') {
        console.warn(`Invalid recipe ID: ${id}, creating custom recipe placeholder`);
        return this.createFallbackRecipe(id, 'Invalid recipe ID');
      }
      
      // Normalize and validate recipe ID
      const numericId = this.normalizeRecipeId(id);
      if (isNaN(numericId) || numericId <= 0) {
        console.warn(`Invalid recipe ID format: ${id}. Recipe IDs should be positive numbers.`);
        return this.createFallbackRecipe(id, 'Invalid recipe ID format. Recipe IDs should be positive numbers.');
      }

      // Check cache first
      const cachedRecipe = await storage.getRecipeFromCache(numericId.toString());
      if (cachedRecipe) {
        console.log(`Using cached recipe data for id ${numericId}`);
        return cachedRecipe.data as unknown as RecipeDetails;
      }

      // Make API request if not in cache
      const params = {
        apiKey: this.apiKey,
        includeNutrition: 'true',
        instructionsRequired: 'true',
        fillIngredients: 'true'
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${this.baseUrl}/recipes/${encodeURIComponent(numericId.toString())}/information?${queryString}`;
      console.log(`Fetching recipe from Spoonacular: ${url.replace(this.apiKey, '[API_KEY]')}`);

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 404) {
          console.warn(`Recipe with ID ${id} not found in Spoonacular API. This could mean:\n1. The recipe has been removed\n2. The recipe ID is not valid\n3. The recipe is not publicly available`);
          return this.createFallbackRecipe(id, 'Recipe not found in database');
        }
        
        const errorText = await response.text();
        console.error(`Spoonacular API error (${response.status}): ${errorText}`);
        throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
      }

      const recipe = await response.json();
      console.log(`Successfully fetched recipe data for id ${id}`);

      // Cache the recipe for future use
      await storage.cacheRecipe({
        id: recipe.id.toString(),
        data: recipe,
        cachedAt: new Date()
      });

      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition || { nutrients: [] },
        extendedIngredients: recipe.extendedIngredients || [],
        sourceUrl: recipe.sourceUrl,
        sourceName: recipe.sourceName,
        creditsText: recipe.creditsText,
        diets: recipe.diets
      };
    } catch (error: any) {
      console.error(`Recipe fetch error for ID ${id}:`, error);
      
      // Provide a fallback recipe even if there's another error
      console.log(`Creating fallback recipe for ID ${id} due to error`);
      return this.createFallbackRecipe(id, 'Error fetching recipe details');
    }
  }

  /**
   * Creates a fallback recipe when the requested recipe cannot be found
   */
  private createFallbackRecipe(id: string | number, reason: string): RecipeDetails {
    // Store the original ID for the title
    const originalId = id;
    // Normalize for API purposes
    const normalizedId = isNaN(Number(id)) ? 999999 : Number(id);
    
    const fallbackRecipe = {
      id: normalizedId,
      title: `Recipe ${originalId} (Unavailable)`,
      image: 'https://placehold.co/600x400/gray/white?text=Recipe+Unavailable',
      readyInMinutes: 0,
      servings: 1,
      instructions: `Recipe details are unavailable. Reason: ${reason}`,
      nutrition: { nutrients: [] },
      extendedIngredients: [],
      sourceName: 'Unknown'
    };

    // Cache fallback to prevent repeated API calls
    storage.cacheRecipe({
      id: normalizedId.toString(),
      data: fallbackRecipe,
      cachedAt: new Date()
    }).catch(err => console.error('Failed to cache fallback recipe:', err));

    return fallbackRecipe;
  }

  /**
   * Generate a shopping list from a meal plan
   */
  async generateShoppingList(recipeIds: (string | number)[]): Promise<any[]> {
    try {
      // Collect all ingredients from recipes
      const ingredients: any[] = [];
      const failedRecipes: (string | number)[] = [];
      
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
          // Continue with other recipes instead of failing the whole process
          continue;
        }
      }

      if (ingredients.length === 0 && failedRecipes.length > 0) {
        // If we couldn't get any ingredients, add a default message item
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
      
      // Return a minimal list with an error message instead of failing
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
   * Helper method to group similar ingredients
   */
  private groupSimilarIngredients(ingredients: any[]): any[] {
    const groupedMap = new Map<string, any>();
    
    for (const ingredient of ingredients) {
      const key = ingredient.name.toLowerCase();
      
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key);
        
        // Only add amounts if units match
        if (existing.unit === ingredient.unit) {
          existing.amount += ingredient.amount;
        } else {
          // If units don't match, keep as separate entries with clarification
          const newKey = `${key} (${ingredient.unit})`;
          groupedMap.set(newKey, ingredient);
        }
      } else {
        groupedMap.set(key, { ...ingredient });
      }
    }
    
    return Array.from(groupedMap.values());
  }

  /**
   * Get random recipes that match certain criteria
   * This is used to get valid recipe IDs for meal planning
   */
  async getRandomRecipes(params: { 
    number?: number;
    tags?: string[];
    diet?: string;
  } = {}): Promise<any[]> {
    try {
      const queryParams: Record<string, string> = {
        apiKey: this.apiKey,
        number: String(params.number || 100),
        addRecipeInformation: 'true',
        sort: 'random'
      };

      if (params.tags?.length) queryParams.tags = params.tags.join(',');
      if (params.diet) queryParams.diet = params.diet;

      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const response = await fetch(`${this.baseUrl}/recipes/random?${queryString}`);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        const errorText = await response.text();
        throw new Error(`Spoonacular API error: ${errorText}`);
      }

      const data = await response.json();
      return data.recipes || [];
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      return [];
    }
  }
}