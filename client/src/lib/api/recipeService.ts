import apiClient from "./apiClient";
import {
  Recipe,
  RecipesResponse,
  SearchRecipesParams,
  NaturalLanguageSearchParams
} from "./types";

class RecipeService {
  /**
   * Search for recipes with given parameters
   */
  async searchRecipes(params: SearchRecipesParams = {}): Promise<RecipesResponse> {
    return apiClient.get<RecipesResponse>("/recipes/search", { params });
  }
  
  /**
   * Search for recipes with natural language query
   * This allows users to search in conversational language
   */
  async searchRecipesNaturalLanguage(query: string, limit: number = 20): Promise<RecipesResponse> {
    const params: NaturalLanguageSearchParams = {
      q: query,
      number: limit
    };
    return apiClient.get<RecipesResponse>("/recipes/search/natural", { params });
  }
  
  /**
   * Get a single recipe by ID
   */
  async getRecipeById(id: string): Promise<Recipe> {
    return apiClient.get<Recipe>(`/recipes/${id}`);
  }
  
  /**
   * Get similar recipes
   */
  async getSimilarRecipes(id: string, limit: number = 4): Promise<Recipe[]> {
    return apiClient.get<Recipe[]>(`/recipes/${id}/similar`, { params: { limit } });
  }
  
  /**
   * Get recipes by diet
   */
  async getRecipesByDiet(diet: string, limit: number = 10, offset: number = 0): Promise<RecipesResponse> {
    return apiClient.get<RecipesResponse>(`/recipes/filter`, {
      params: { diet, limit, offset }
    });
  }
  
  /**
   * Get recipes by meal type
   */
  async getRecipesByMealType(type: string, limit: number = 10, offset: number = 0): Promise<RecipesResponse> {
    return apiClient.get<RecipesResponse>(`/recipes/filter`, {
      params: { type, limit, offset }
    });
  }
  
  /**
   * Get random recipes
   */
  async getRandomRecipes(count: number = 10, tags?: string[]): Promise<Recipe[]> {
    return apiClient.get<Recipe[]>("/recipes/random", {
      params: { count, tags: tags?.join(",") }
    });
  }
  
  /**
   * Get popular/trending recipes
   */
  async getPopularRecipes(limit: number = 10): Promise<Recipe[]> {
    return apiClient.get<Recipe[]>("/recipes/popular", { params: { limit } });
  }
  
  /**
   * Get user favorite recipes
   */
  async getFavoriteRecipes(): Promise<Recipe[]> {
    return apiClient.get<Recipe[]>("/recipes/favorites");
  }
  
  /**
   * Add recipe to favorites
   */
  async addToFavorites(id: string): Promise<void> {
    return apiClient.post<void>(`/recipes/${id}/favorite`);
  }
  
  /**
   * Remove recipe from favorites
   */
  async removeFromFavorites(id: string): Promise<void> {
    return apiClient.delete<void>(`/recipes/${id}/favorite`);
  }
  
  /**
   * Get a recipe's nutritional information
   */
  async getRecipeNutrition(id: string): Promise<any> {
    return apiClient.get<any>(`/recipes/${id}/nutrition`);
  }
  
  /**
   * Get recipe's ingredients with amounts
   */
  async getRecipeIngredients(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/recipes/${id}/ingredients`);
  }
  
  /**
   * Get recipe's equipment needed
   */
  async getRecipeEquipment(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/recipes/${id}/equipment`);
  }
  
  /**
   * Get recipe instructions (step by step)
   */
  async getRecipeInstructions(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/recipes/${id}/instructions`);
  }
  
  /**
   * Search recipes by ingredients
   */
  async searchByIngredients(ingredients: string[], limit: number = 10): Promise<Recipe[]> {
    return apiClient.get<Recipe[]>("/recipes/findByIngredients", {
      params: { ingredients: ingredients.join(","), limit }
    });
  }
}

export const recipeService = new RecipeService();
export default recipeService;