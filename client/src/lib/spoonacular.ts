import { useApiClient } from "./api/client";

export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  instructions: string;
  diets?: string[];
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

export interface SearchFilters {
  query?: string;
  diet?: string;
  maxCalories?: number;
}

export interface MealPlanPreferences {
  diet?: string;
  calories?: number;
  allergies?: string[];
  dislikes?: string[];
  cuisinePreferences?: string[];
  goalType?: string;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  mealCount?: number;
  budgetPerMeal?: number;
  cookingTime?: number;
  servings?: number;
}

export interface Meal {
  id: number;
  mealPlanId: number;
  recipeId: number;
  mealType: string;
  title: string;
  imageUrl?: string;
  readyInMinutes?: number;
  servings?: number;
  createdAt: string;
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

// Create a helper function that ensures we use the authenticated client
let apiClientInstance: ReturnType<typeof useApiClient> | null = null;

function getApiClientInstance() {
  if (!apiClientInstance) {
    // This is a fallback, but ideally the client should be provided by the component
    console.warn("ApiClient instance not provided, creating a new instance");
    apiClientInstance = useApiClient();
  }
  return apiClientInstance;
}

export function setApiClientInstance(client: ReturnType<typeof useApiClient>) {
  apiClientInstance = client;
}

export async function searchRecipes(filters: SearchFilters): Promise<Recipe[]> {
  const response = await getApiClientInstance().searchRecipes(filters);
  return response.recipes || [];
}

export async function getRecipe(id: number): Promise<Recipe> {
  const response = await getApiClientInstance().getRecipeById(id.toString());
  if (!response.success || !response.recipe) {
    throw new Error("Failed to fetch recipe");
  }
  return response.recipe;
}

export async function generateMealPlan(date: string, preferences: MealPlanPreferences): Promise<MealPlan> {
  const response = await getApiClientInstance().generateMealPlan({
    date,
    preferences
  });
  
  if (!response.success || !response.mealPlans || !response.mealPlans[0]) {
    throw new Error("Failed to generate meal plan");
  }
  
  return response.mealPlans[0];
}

export async function getMealPlans(): Promise<MealPlan[]> {
  const response = await getApiClientInstance().getMealPlans();
  
  if (!response.success || !response.mealPlans) {
    throw new Error("Failed to fetch meal plans");
  }
  
  return response.mealPlans;
}

export async function getMealPlanById(id: number): Promise<MealPlan> {
  const response = await getApiClientInstance().getMealPlanById(id);
  
  if (!response.success || !response.mealPlan) {
    throw new Error("Failed to fetch meal plan");
  }
  
  return response.mealPlan;
}

export async function getSavedRecipes(): Promise<Recipe[]> {
  const response = await getApiClientInstance().getSavedRecipes();
  
  if (!response.success || !response.recipes) {
    throw new Error("Failed to fetch saved recipes");
  }
  
  return response.recipes;
}

export async function saveRecipe(recipeId: number): Promise<boolean> {
  const response = await getApiClientInstance().saveRecipe(recipeId);
  
  if (!response.success) {
    throw new Error("Failed to save recipe");
  }
  
  return true;
}

export async function unsaveRecipe(recipeId: number): Promise<boolean> {
  const response = await getApiClientInstance().unsaveRecipe(recipeId);
  
  if (!response.success) {
    throw new Error("Failed to unsave recipe");
  }
  
  return true;
}