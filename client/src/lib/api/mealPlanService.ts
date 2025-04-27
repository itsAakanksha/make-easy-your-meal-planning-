import apiClient from "./apiClient";
import {
  MealPlan,
  GenerateMealPlanRequest,
  ApiResponse,
  PaginatedResponse,
  ShoppingList
} from "./types";

class MealPlanService {
  /**
   * Generate a new meal plan
   */
  async generateMealPlan(data: GenerateMealPlanRequest): Promise<MealPlan> {
    return apiClient.post<MealPlan>("/meal-plans", data);
  }
  
  /**
   * Get all meal plans for the current user
   */
  async getMealPlans(page: number = 1, limit: number = 10): Promise<PaginatedResponse<MealPlan>> {
    return apiClient.get<PaginatedResponse<MealPlan>>("/meal-plans", {
      params: { page, limit }
    });
  }
  
  /**
   * Get all meal plans for the currently authenticated user
   * This is a simplified version without pagination
   */
  async getUserMealPlans(): Promise<MealPlan[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<MealPlan>>("/meal-plans");
      return response.items || [];
    } catch (error) {
      console.error("Error fetching user meal plans:", error);
      return [];
    }
  }
  
  /**
   * Get a specific meal plan by ID
   */
  async getMealPlanById(id: string): Promise<ApiResponse<MealPlan>> {
    return apiClient.get<ApiResponse<MealPlan>>(`/meal-plans/${id}`);
  }
  
  /**
   * Update an existing meal plan
   */
  async updateMealPlan(id: string, data: Partial<MealPlan>): Promise<MealPlan> {
    return apiClient.patch<MealPlan>(`/meal-plans/${id}`, data);
  }
  
  /**
   * Delete a meal plan
   */
  async deleteMealPlan(id: string): Promise<void> {
    return apiClient.delete<void>(`/meal-plans/${id}`);
  }
  
  /**
   * Replace a meal in a meal plan
   */
  async replaceMeal(mealPlanId: string, mealId: string, newRecipeId: string): Promise<MealPlan> {
    return apiClient.post<MealPlan>(`/meal-plans/${mealPlanId}/meals/${mealId}/replace`, {
      recipeId: newRecipeId
    });
  }
  
  /**
   * Generate a shopping list for a meal plan
   */
  async generateShoppingList(mealPlanId: string): Promise<ShoppingList> {
    return apiClient.get<ShoppingList>(`/meal-plans/${mealPlanId}/shopping-list`);
  }
  
  /**
   * Get a previously generated shopping list
   */
  async getShoppingList(mealPlanId: string): Promise<ShoppingList> {
    return apiClient.get<ShoppingList>(`/meal-plans/${mealPlanId}/shopping-list`);
  }
  
  /**
   * Update the shopping list (mark items, add custom items, etc.)
   */
  async updateShoppingList(mealPlanId: string, data: Partial<ShoppingList>): Promise<ShoppingList> {
    return apiClient.patch<ShoppingList>(`/meal-plans/${mealPlanId}/shopping-list`, data);
  }
  
  /**
   * Email the shopping list to the user
   */
  async emailShoppingList(mealPlanId: string, email?: string): Promise<void> {
    return apiClient.post<void>(`/meal-plans/${mealPlanId}/shopping-list/email`, { email });
  }
  
  /**
   * Get a printable version of the shopping list
   */
  async getPrintableShoppingList(mealPlanId: string): Promise<string> {
    return apiClient.get<string>(`/meal-plans/${mealPlanId}/shopping-list/printable`);
  }
  
  /**
   * Save a meal plan as a template
   */
  async saveAsTemplate(mealPlanId: string, name: string): Promise<void> {
    return apiClient.post<void>(`/meal-plans/${mealPlanId}/save-template`, { name });
  }
  
  /**
   * Get user's saved meal plan templates
   */
  async getMealPlanTemplates(): Promise<PaginatedResponse<MealPlan>> {
    return apiClient.get<PaginatedResponse<MealPlan>>(`/meal-plans/templates`);
  }
  
  /**
   * Create meal plan from template
   */
  async createFromTemplate(templateId: string): Promise<MealPlan> {
    return apiClient.post<MealPlan>(`/meal-plans/from-template/${templateId}`);
  }
}

export const mealPlanService = new MealPlanService();
export default mealPlanService;