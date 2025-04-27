import { useAuth } from "@clerk/clerk-react";
import * as React from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Error class for API responses
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Utility to get auth token from Clerk - cannot use hooks outside React components
export const getAuthToken = async (getTokenFn?: () => Promise<string | null>): Promise<string | null> => {
  try {
    // If getTokenFn is provided (from the useApiClient hook), use it
    if (getTokenFn) {
      return await getTokenFn();
    }
    return null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Base API client with authentication
export const apiClient = {
  async fetchWithAuth(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || response.statusText,
        errorData
      );
    }

    return response;
  },

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'GET',
      ...options,
    });
    return response.json();
  },

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response.json();
  },

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response.json();
  },

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'DELETE',
      ...options,
    });
    return response.json();
  },
  
  // User profile methods
  async getUserProfile() {
    try {
      return await this.get<{ success: boolean, profile: UserProfile }>('/users/me/profile');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, profile: null };
    }
  },
  
  async updateUserProfile(data: Partial<UserProfile>) {
    try {
      return await this.put<{ success: boolean, profile: UserProfile }>('/users/me/profile', data);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, profile: null };
    }
  },
  
  // Meal plan methods
  async getMealPlans() {
    try {
      return await this.get<{ success: boolean, mealPlans: MealPlan[] }>('/meal-plans');
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      return { success: false, mealPlans: [] };
    }
  }
};

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
 * React hook to use the API client
 */
export function useApiClient() {
  const { getToken } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // Create a client instance that uses the authentication from this hook
  const apiClientInstance = React.useMemo(() => {
    return {
      ...apiClient,
      async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
        // Use the getToken function from the hook context
        const token = await getAuthToken(() => getToken());
        
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers,
        };
    
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
    
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            response.status,
            errorData.message || response.statusText,
            errorData
          );
        }
    
        return response;
      }
    };
  }, [baseUrl, getToken]);
  
  return apiClientInstance;
}