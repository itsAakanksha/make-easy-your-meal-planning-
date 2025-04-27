import axios from 'axios';
import { ApiError } from './error.classes';

// Define interfaces for Spoonacular requests and responses
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
  // ... other fields
}

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Search for recipes using Spoonacular API
 */
export async function searchRecipes(params: RecipeSearchParams): Promise<RecipeDetails[]> {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new ApiError('Spoonacular API key not configured', 500);
    }

    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.append('apiKey', apiKey);
    queryParams.append('addRecipeInformation', 'true');
    queryParams.append('addRecipeNutrition', 'true');
    queryParams.append('fillIngredients', 'true');
    queryParams.append('number', params.number?.toString() || '20');

    if (params.query) {
      queryParams.append('query', params.query);
    }
    
    if (params.diet) {
      queryParams.append('diet', params.diet);
    }
    
    if (params.cuisines && params.cuisines.length > 0) {
      queryParams.append('cuisine', params.cuisines.join(','));
    }
    
    if (params.excludeIngredients && params.excludeIngredients.length > 0) {
      queryParams.append('excludeIngredients', params.excludeIngredients.join(','));
    }
    
    if (params.maxReadyTime) {
      queryParams.append('maxReadyTime', params.maxReadyTime.toString());
    }
    
    if (params.minCalories) {
      queryParams.append('minCalories', params.minCalories.toString());
    }
    
    if (params.maxCalories) {
      queryParams.append('maxCalories', params.maxCalories.toString());
    }
    
    if (params.minProtein) {
      queryParams.append('minProtein', params.minProtein.toString());
    }
    
    if (params.maxProtein) {
      queryParams.append('maxProtein', params.maxProtein.toString());
    }
    
    if (params.minCarbs) {
      queryParams.append('minCarbs', params.minCarbs.toString());
    }
    
    if (params.maxCarbs) {
      queryParams.append('maxCarbs', params.maxCarbs.toString());
    }
    
    if (params.minFat) {
      queryParams.append('minFat', params.minFat.toString());
    }
    
    if (params.maxFat) {
      queryParams.append('maxFat', params.maxFat.toString());
    }

    // Generate cache key from query params
    const cacheKey = `search_${queryParams.toString()}`;
    
    // Check cache first
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      console.log('Returning cached search results');
      return cache[cacheKey].data;
    }

    // Make API request
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?${queryParams.toString()}`
    );

    if (!response.data || !response.data.results) {
      throw new ApiError('Invalid response from Spoonacular API', 500);
    }

    // Cache the results
    cache[cacheKey] = {
      data: response.data.results,
      timestamp: Date.now()
    };

    return response.data.results;
  } catch (error) {
    console.error('Error searching recipes:', error);
    
    if (axios.isAxiosError(error)) {
      handleSpoonacularApiError(error);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to search recipes', 500);
  }
}

/**
 * Get detailed recipe information by ID
 */
export async function getRecipeInformation(id: number, bypassCache = false): Promise<RecipeDetails> {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new ApiError('Spoonacular API key not configured', 500);
    }

    // Generate cache key
    const cacheKey = `recipe_${id}`;
    
    // Check cache first (unless bypass is requested)
    if (!bypassCache && cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      console.log(`Returning cached recipe #${id}`);
      return cache[cacheKey].data;
    }

    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.append('apiKey', apiKey);
    queryParams.append('includeNutrition', 'true');

    // Make API request
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information?${queryParams.toString()}`
    );

    if (!response.data) {
      throw new ApiError('Invalid response from Spoonacular API', 500);
    }

    // Cache the results
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };

    return response.data;
  } catch (error) {
    console.error(`Error getting recipe #${id}:`, error);
    
    if (axios.isAxiosError(error)) {
      handleSpoonacularApiError(error);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to get recipe information', 500);
  }
}

/**
 * Get detailed information for multiple recipes at once
 */
export async function getRecipeInformationBulk(ids: number[]): Promise<RecipeDetails[]> {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new ApiError('Spoonacular API key not configured', 500);
    }

    // Convert all ids to strings
    const recipeIds = ids.map(id => id.toString());
    
    // Generate cache key
    const cacheKey = `recipes_bulk_${recipeIds.join('_')}`;
    
    // Check cache first
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      console.log('Returning cached bulk recipe information');
      return cache[cacheKey].data;
    }

    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.append('apiKey', apiKey);
    queryParams.append('includeNutrition', 'true');
    queryParams.append('ids', recipeIds.join(','));

    // Make API request
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/informationBulk?${queryParams.toString()}`
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new ApiError('Invalid response from Spoonacular API', 500);
    }

    // Cache the results
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };

    return response.data;
  } catch (error) {
    console.error('Error getting bulk recipe information:', error);
    
    if (axios.isAxiosError(error)) {
      handleSpoonacularApiError(error);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to get bulk recipe information', 500);
  }
}

/**
 * Generate a meal plan using Spoonacular API
 */
export async function generateMealPlan(params: {
  timeFrame: 'day' | 'week';
  targetCalories?: number;
  diet?: string;
  exclude?: string[];
}): Promise<any> {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new ApiError('Spoonacular API key not configured', 500);
    }

    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.append('apiKey', apiKey);
    queryParams.append('timeFrame', params.timeFrame);
    
    if (params.targetCalories) {
      queryParams.append('targetCalories', params.targetCalories.toString());
    }
    
    if (params.diet) {
      queryParams.append('diet', params.diet);
    }
    
    if (params.exclude && params.exclude.length > 0) {
      queryParams.append('exclude', params.exclude.join(','));
    }

    // Generate cache key from query params
    const cacheKey = `meal_plan_${queryParams.toString()}`;
    
    // Check cache first
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      console.log('Returning cached meal plan');
      return cache[cacheKey].data;
    }

    // Make API request
    const response = await axios.get(
      `https://api.spoonacular.com/mealplanner/generate?${queryParams.toString()}`
    );

    if (!response.data) {
      throw new ApiError('Invalid response from Spoonacular API', 500);
    }

    // Cache the results
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };

    return response.data;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    
    if (axios.isAxiosError(error)) {
      handleSpoonacularApiError(error);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to generate meal plan', 500);
  }
}

/**
 * Handle Spoonacular API errors consistently
 */
function handleSpoonacularApiError(error: any): never {
  if (axios.isAxiosError(error)) {
    // Handle rate limit errors
    if (error.response?.status === 402) {
      throw new ApiError('Daily API quota exceeded. Please try again tomorrow.', 429);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new ApiError('Authentication failed with Spoonacular API', 500);
    }
    
    // Handle other API errors
    if (error.response?.data?.message) {
      throw new ApiError(`Spoonacular API error: ${error.response.data.message}`, error.response.status);
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new ApiError('Unable to connect to recipe service', 503);
    }
  }
  
  // Default error
  throw new ApiError('Error communicating with recipe service', 500);
}