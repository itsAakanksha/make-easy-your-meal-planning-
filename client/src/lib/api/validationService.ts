/**
 * Data validation service
 * Functions to validate data integrity across the application
 */

import { apiClient } from './client';

export interface ValidationResult {
  success: boolean;
  validation?: {
    userCreation?: boolean;
    userProfile?: boolean;
    userPreferences?: boolean;
  };
  allValid?: boolean;
  message?: string;
}

export interface MealPlanValidationResult {
  success: boolean;
  mealPlanId: number;
  validated: boolean;
}

export interface RecipeEmbeddingValidationResult {
  success: boolean;
  recipeId: number;
  validated: boolean;
}

/**
 * Validation service for data integrity
 */
export const validationService = {
  /**
   * Validate user data integrity
   * This checks that the user's data is correctly stored and retrievable
   */
  validateUserData: async (): Promise<ValidationResult> => {
    try {
      return await apiClient.get<ValidationResult>('/users/me/validate');
    } catch (error) {
      console.error('Error validating user data:', error);
      return {
        success: false,
        message: 'Failed to validate user data'
      };
    }
  },

  /**
   * Validate meal plan data integrity
   * @param mealPlanId The ID of the meal plan to validate
   */
  validateMealPlan: async (mealPlanId: number): Promise<MealPlanValidationResult> => {
    try {
      return await apiClient.get<MealPlanValidationResult>(`/meal-plans/${mealPlanId}/validate`);
    } catch (error) {
      console.error(`Error validating meal plan ${mealPlanId}:`, error);
      return {
        success: false,
        mealPlanId,
        validated: false
      };
    }
  },

  /**
   * Generate embedding for a recipe to power semantic search
   * @param recipeId The ID of the recipe
   */
  generateRecipeEmbedding: async (recipeId: number): Promise<RecipeEmbeddingValidationResult> => {
    try {
      return await apiClient.post<RecipeEmbeddingValidationResult>(`/recipes/${recipeId}/embedding`);
    } catch (error) {
      console.error(`Error generating embedding for recipe ${recipeId}:`, error);
      return {
        success: false,
        recipeId,
        validated: false
      };
    }
  },

  /**
   * Validate recipe embedding
   * @param recipeId The ID of the recipe
   */
  validateRecipeEmbedding: async (recipeId: number): Promise<RecipeEmbeddingValidationResult> => {
    try {
      return await apiClient.get<RecipeEmbeddingValidationResult>(`/recipes/${recipeId}/validate-embedding`);
    } catch (error) {
      console.error(`Error validating embedding for recipe ${recipeId}:`, error);
      return {
        success: false,
        recipeId,
        validated: false
      };
    }
  }
};