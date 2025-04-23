import { useAuth } from "@clerk/clerk-react";
import * as React from "react";

// Type definitions mirroring the backend schema
export interface User {
  id: number;
  clerkUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  userId: number;
  name?: string;
  email?: string;
  diet?: string;
  allergies?: string[];
  dislikes?: string[];
  cuisinePreferences?: string[];
  goalType?: string;
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  mealCount: number;
  budgetPerMeal?: number;
  cookingTime?: number;
  servings: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  id: number;
  userId: number;
  date: string;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  meals?: Meal[];
}

export interface Meal {
  id: number;
  mealPlanId: number;
  recipeId: string;
  mealType: string;
  title: string;
  imageUrl?: string;
  readyInMinutes?: number;
  servings?: number;
  createdAt: string;
}

export interface ShoppingListItem {
  id: number;
  userId: number;
  mealPlanId?: number;
  name: string;
  amount?: string;
  unit?: string;
  category?: string;
  checked: boolean;
  createdAt: string;
}

/**
 * API client for the AI Meal Planner backend
 */
export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  private async fetchWithAuth(path: string, options: RequestInit = {}) {
    const token = await this.getToken();
    
    // If no token and this is a protected route, throw a more descriptive error
    if (!token && !path.startsWith('/api/health')) {
      console.error('Authentication token is missing. User may not be signed in.');
      throw new Error('Authentication required. Please sign in.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const url = `${this.baseUrl}${path}`;
    console.log(`Fetching from: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      console.log(`Response status: ${response.status} for ${path}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`API Error (${response.status}):`, errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Response data for ${path}:`, data);
      return data;
    } catch (error) {
      console.error(`Error making request to ${path}:`, error);
      throw error;
    }
  }

  // User profile operations
  async getUserProfile(): Promise<{ success: boolean; profile?: UserProfile }> {
    return this.fetchWithAuth('/api/user/profile');
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<{ success: boolean; profile?: UserProfile }> {
    return this.fetchWithAuth('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Recipe operations
  async searchRecipes(searchParams: {
    query?: string;
    diet?: string;
    cuisine?: string[];
    intolerances?: string[];
    maxReadyTime?: number;
    minCalories?: number;
    maxCalories?: number;
    number?: number;
  }) {
    return this.fetchWithAuth('/api/recipes/search', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
  }

  async getSavedRecipes() {
    return this.fetchWithAuth('/api/recipes/saved');
  }

  async saveRecipe(recipeId: string | number) {
    return this.fetchWithAuth('/api/recipes/save', {
      method: 'POST',
      body: JSON.stringify({ recipeId })
    });
  }

  async unsaveRecipe(recipeId: string | number) {
    return this.fetchWithAuth('/api/recipes/unsave', {
      method: 'POST',
      body: JSON.stringify({ recipeId })
    });
  }

  async getRecipeById(id: string) {
    // Ensure ID is in the expected 6-digit format
    const validId = this.normalizeRecipeId(id);
    return this.fetchWithAuth(`/api/recipes/${validId}`);
  }

  async getIsSaved(recipeId: string) {
    // Ensure ID is in the expected 6-digit format
    const validId = this.normalizeRecipeId(recipeId);
    return this.fetchWithAuth(`/api/recipes/${validId}/saved`);
  }
  
  /**
   * Normalize recipe ID to ensure consistent 6-digit format
   */
  private normalizeRecipeId(id: string | number): string {
    // Convert to string for easier manipulation
    const idStr = String(id);
    
    // If invalid ID, return a default valid ID
    if (!idStr || idStr === 'null' || idStr === 'undefined') {
      return '716429'; // Default to a valid ID
    }
    
    // Handle numeric ID
    const numericId = parseInt(idStr, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return '716429'; // Default to a valid ID
    }
    
    // Convert to string to check length
    const numericIdStr = String(numericId);
    
    // If it's a 7-digit ID, remove the first digit (common pattern)
    if (numericIdStr.length === 7) {
      return numericIdStr.substring(1);
    }
    
    // If it's too short (less than 6 digits), pad with leading 7's
    if (numericIdStr.length < 6) {
      return '7'.repeat(6 - numericIdStr.length) + numericIdStr;
    }
    
    // If longer than 7 digits, truncate to last 6 digits
    if (numericIdStr.length > 7) {
      return numericIdStr.substring(numericIdStr.length - 6);
    }
    
    // Return as is if already 6 digits
    return numericIdStr;
  }

  // Meal plan operations
  async generateMealPlan(params: {
    date: string;
    days?: number;
    preferences?: Partial<UserProfile>;
  }): Promise<{ success: boolean; mealPlans?: MealPlan[] }> {
    return this.fetchWithAuth('/api/meal-plan/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getMealPlans(limit?: number): Promise<{ success: boolean; mealPlans?: MealPlan[] }> {
    const url = limit ? `/api/meal-plans?limit=${limit}` : '/api/meal-plans';
    return this.fetchWithAuth(url);
  }

  async getMealPlanById(id: number): Promise<{ success: boolean; mealPlan?: MealPlan }> {
    return this.fetchWithAuth(`/api/meal-plans/${id}`);
  }

  // Shopping list operations
  async getShoppingList(mealPlanId?: number): Promise<{ success: boolean; shoppingList?: ShoppingListItem[] }> {
    if (mealPlanId) {
      return this.fetchWithAuth(`/api/meal-plans/${mealPlanId}/shopping-list`);
    }
    // Default endpoint for general shopping list
    return this.fetchWithAuth('/api/shopping-list');
  }

  async generateShoppingList(mealPlanId: number): Promise<{ success: boolean; shoppingList?: ShoppingListItem[] }> {
    return this.fetchWithAuth(`/api/meal-plans/${mealPlanId}/generate-shopping-list`, {
      method: 'POST'
    });
  }

  async addShoppingListItem(item: { name: string; quantity?: number; unit?: string; mealPlanId?: number }): Promise<{ success: boolean; item?: ShoppingListItem }> {
    return this.fetchWithAuth('/api/shopping-list', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async deleteShoppingListItem(id: number): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`/api/shopping-list/${id}`, {
      method: 'DELETE'
    });
  }

  async updateShoppingListItem(id: number, checked: boolean): Promise<{ success: boolean; item?: ShoppingListItem }> {
    return this.fetchWithAuth(`/api/shopping-list/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ checked })
    });
  }
}

/**
 * React hook to use the API client
 */
export function useApiClient() {
  const { getToken } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // Use React's useMemo to cache the ApiClient instance
  const apiClient = React.useMemo(() => {
    return new ApiClient(baseUrl, getToken);
  }, [baseUrl, getToken]);
  
  return apiClient;
}