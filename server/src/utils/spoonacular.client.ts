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
  ids?: number[]; // Add support for searching by IDs
}

export interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary?: string;           // Added for recipe summary text
  instructions?: string;      // Added for cooking instructions
  extendedIngredients?: Array<{  // Added for ingredients list
    name: string;
    amount: number;
    unit: string;
    id?: number;
    original?: string;
  }>;
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
const CACHE_TTL = 30 * 60 * 1000; // Reduced to 30 minutes
const SEARCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for search results

/**
 * Search for recipes using Spoonacular API with pagination to get more results
 */
export async function searchRecipes(params: RecipeSearchParams): Promise<RecipeDetails[]> {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      console.error('Spoonacular API key is missing in environment variables');
      throw new ApiError('Spoonacular API key not configured', 500);
    }

    // Determine how many recipes we actually need
    const requestedNumber = params.number || 30;
    
    // If we need a large number of recipes, use pagination
    if (requestedNumber > 100) {
      console.log(`Requesting ${requestedNumber} recipes using pagination strategy`);
      return searchRecipesWithPagination(params);
    }

    // For smaller numbers, use the standard approach
    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.append('apiKey', apiKey);
    queryParams.append('addRecipeInformation', 'true');
    queryParams.append('addRecipeNutrition', 'true');
    queryParams.append('fillIngredients', 'true');
    
    // Spoonacular limits to 100 per request
    const number = Math.min(requestedNumber, 100);
    queryParams.append('number', number.toString());

    // Add randomness to get more variety in results
    // Add random offset to access different parts of the recipe database
    const randomOffset = Math.floor(Math.random() * 900);
    queryParams.append('offset', randomOffset.toString());
    
    // Always use random sort for more variety
    queryParams.append('sort', 'random');
    
    // Add an instructionsRequired parameter to ensure we get complete recipes
    queryParams.append('instructionsRequired', 'true');

    // If IDs are provided, use them instead of complex search
    if (params.ids && params.ids.length > 0) {
      return getRecipeInformationBulk(params.ids);
    }

    // Focus search more to get higher quality results
    if (params.query) {
      queryParams.append('query', params.query);
    } else {
      // If no specific query, add a broad query that matches most recipes
      // This helps avoid the API returning too few results
      queryParams.append('query', 'recipe');
    }
    
    if (params.diet) {
      // Send diet parameter exactly as provided
      queryParams.append('diet', params.diet);
      console.log(`Searching for recipes with diet: ${params.diet}`);
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

    // Generate cache key, but add a timestamp-based component to reduce cache hits
    const hourKey = Math.floor(Date.now() / (60 * 60 * 1000));
    const cacheKey = `search_${queryParams.toString()}_hour${hourKey}`;
    
    // Check cache with shorter TTL
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < SEARCH_CACHE_TTL)) {
      console.log('Returning cached search results with shuffling');
      
      // Always shuffle results when using cache to increase variety
      const shuffledResults = [...cache[cacheKey].data];
      for (let i = shuffledResults.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledResults[i], shuffledResults[j]] = [shuffledResults[j], shuffledResults[i]];
      }
      
      return shuffledResults;
    }

    console.log(`Making API request to Spoonacular with params: ${queryParams.toString()}`);
    
    // Add retry mechanism for resilience
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        // Make API request
        const response = await axios.get(
          `https://api.spoonacular.com/recipes/complexSearch?${queryParams.toString()}`,
          { timeout: 15000 } // 15-second timeout
        );

        if (!response.data || !response.data.results) {
          console.error('Invalid response structure from Spoonacular API:', response.data);
          throw new ApiError('Invalid response from Spoonacular API', 500);
        }

        const resultCount = response.data.results.length;
        console.log(`Got ${resultCount} recipes from Spoonacular API`);
        
        // If we got too few results, retry with different parameters
        if (resultCount < Math.min(requestedNumber, 10) && params.diet) {
          console.warn(`Too few results (${resultCount}). Trying again without diet restriction.`);
          // Make a copy of params without the diet
          const relaxedParams = { ...params };
          delete relaxedParams.diet;
          return searchRecipes(relaxedParams);
        }
        
        // Log the first few recipes to debug diet issues
        if (resultCount > 0) {
          const sampleRecipes = response.data.results.slice(0, 3);
          console.log("Sample recipes with diets:");
          sampleRecipes.forEach((recipe: RecipeDetails) => {
            console.log(`Recipe ID ${recipe.id}: ${recipe.title}, Diets: ${recipe.diets?.join(', ') || 'none'}`);
          });
        }

        // Cache the results
        cache[cacheKey] = {
          data: response.data.results,
          timestamp: Date.now()
        };

        return response.data.results;
      } catch (error: any) {
        retries++;
        console.error(`API request failed (attempt ${retries}/${maxRetries}):`, error?.message || 'Unknown error');
        
        if (retries >= maxRetries) {
          throw error; // Re-throw after max retries
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    // Should never reach here due to the throw in the loop, but TypeScript needs this
    throw new ApiError('Failed after maximum retries', 500);
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
 * Search for recipes using pagination to get many more results than the API limit allows
 */
async function searchRecipesWithPagination(params: RecipeSearchParams): Promise<RecipeDetails[]> {
  const requestedNumber = params.number || 30;
  console.log(`Attempting to fetch ${requestedNumber} recipes using pagination`);
  
  // Create a copy of params for the paginated requests
  const paginatedParams = { ...params };
  
  // Spoonacular has a limit of 100 recipes per request
  const pageSize = 100;
  
  // Calculate how many requests we need to make
  const requiredPages = Math.ceil(requestedNumber / pageSize);
  console.log(`Will fetch ${requiredPages} pages of ${pageSize} recipes each`);
  
  // Track all the recipes we've collected
  const allRecipes: RecipeDetails[] = [];
  
  // Cache key for this pagination request to avoid duplicate recipes
  const seenRecipeIds = new Set<number>();
  
  // Get API key once
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new ApiError('Spoonacular API key not configured', 500);
  }
  
  // Make multiple requests with different offsets to get more recipes
  for (let page = 0; page < requiredPages; page++) {
    if (allRecipes.length >= requestedNumber) {
      console.log(`Reached target of ${requestedNumber} recipes, stopping pagination`);
      break;
    }
    
    // Calculate offset - use a different strategy for each page to maximize variety
    const baseOffset = page * 100;
    const randomOffset = baseOffset + Math.floor(Math.random() * 50);
    
    // Update params for this page
    paginatedParams.number = pageSize;
    
    // A different search approach for each page to maximize variety
    if (page === 0) {
      // First page - use original parameters
    } else if (page === 1 && paginatedParams.diet) {
      // Second page - try without diet restriction if we had one
      console.log("Second page: searching without diet restriction for more variety");
      delete paginatedParams.diet;
    } else if (page === 2) {
      // Third page - use a different sorting strategy
      console.log("Third page: using popularity sort");
      paginatedParams.query = paginatedParams.query || "recipe";
    }
    
    try {
      // Make a copy of parameters for this specific page
      const pageParams = { ...paginatedParams };
      
      // Create unique query for each page request
      const queryParams = new URLSearchParams();
      queryParams.append('apiKey', apiKey);
      queryParams.append('addRecipeInformation', 'true');
      queryParams.append('addRecipeNutrition', 'true');
      queryParams.append('fillIngredients', 'true');
      queryParams.append('number', pageSize.toString());
      queryParams.append('offset', randomOffset.toString());
      
      // Vary sort method for each page to get different results
      if (page % 3 === 0) {
        queryParams.append('sort', 'random');
      } else if (page % 3 === 1) {
        queryParams.append('sort', 'popularity');
      } else {
        queryParams.append('sort', 'healthiness');
      }
      
      // Add specific parameters
      if (pageParams.query) {
        queryParams.append('query', pageParams.query);
      } else {
        queryParams.append('query', 'recipe');
      }
      
      if (pageParams.diet) {
        queryParams.append('diet', pageParams.diet);
      }
      
      if (pageParams.cuisines && pageParams.cuisines.length > 0) {
        queryParams.append('cuisine', pageParams.cuisines.join(','));
      }
      
      if (pageParams.excludeIngredients && pageParams.excludeIngredients.length > 0) {
        queryParams.append('excludeIngredients', pageParams.excludeIngredients.join(','));
      }
      
      if (pageParams.maxReadyTime) {
        queryParams.append('maxReadyTime', pageParams.maxReadyTime.toString());
      }
      
      console.log(`Fetching page ${page + 1}/${requiredPages} with offset ${randomOffset}`);
      
      // Make API request for this page
      const response = await axios.get(
        `https://api.spoonacular.com/recipes/complexSearch?${queryParams.toString()}`,
        { timeout: 15000 }
      );
      
      if (response.data && response.data.results) {
        const pageResults = response.data.results;
        console.log(`Page ${page + 1} returned ${pageResults.length} recipes`);
        
        // Add non-duplicate recipes to our collection
        for (const recipe of pageResults) {
          if (!seenRecipeIds.has(recipe.id)) {
            allRecipes.push(recipe);
            seenRecipeIds.add(recipe.id);
          }
        }
        
        console.log(`Total unique recipes collected: ${allRecipes.length}`);
      }
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error(`Error fetching page ${page + 1}:`, error?.message || 'Unknown error');
      // Continue to next page despite errors
    }
  }
  
  console.log(`Pagination complete. Collected ${allRecipes.length} unique recipes.`);
  
  // Shuffle the results for more variety
  for (let i = allRecipes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRecipes[i], allRecipes[j]] = [allRecipes[j], allRecipes[i]];
  }
  
  // Return only the requested number of recipes
  return allRecipes.slice(0, requestedNumber);
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
  } catch (error: any) {
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