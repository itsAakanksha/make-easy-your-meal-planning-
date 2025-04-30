// Common API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  profileImage?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  dislikedIngredients: string[];
  cuisinePreferences: string[];
  mealComplexity: 'simple' | 'moderate' | 'complex';
  cookingTime: number; // in minutes
  servingSize: number;
  budgetLevel: 'low' | 'medium' | 'high';
  nutritionGoals: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Recipe types
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition: NutritionInfo;
  tags: string[];
  cuisineType: string;
  mealType: string[];
  source: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  description?: string;
  category?: string;
}

export interface Instruction {
  stepNumber: number;
  description: string;
  imageUrl?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
}

export interface RecipeSearchParams extends PaginationParams {
  query?: string;
  ingredients?: string[];
  excludeIngredients?: string[];
  diet?: string[];
  cuisine?: string[];
  mealType?: string[];
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  tags?: string[];
}

export interface SearchRecipesParams extends PaginationParams {
  query?: string;
  ingredients?: string[];
  excludeIngredients?: string[];
  diet?: string[];
  cuisine?: string[];
  mealType?: string[];
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  tags?: string[];
}

// Natural language recipe search params
export interface NaturalLanguageSearchParams {
  q: string;
  number?: number;
}

// Recipe response interfaces
export interface RecipesResponse {
  success: boolean;
  recipes: any[];
  total: number;
  originalQuery?: string;
}

// Meal Plan types
export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  days: MealPlanDay[];
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanDay {
  date: string;
  meals: MealPlanMeal[];
}

export interface MealPlanMeal {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
  servings: number;
}

export interface GenerateMealPlanRequest {
  startDate: string;
  endDate: string;
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    dislikedIngredients?: string[];
    cuisinePreferences?: string[];
    mealComplexity?: 'simple' | 'moderate' | 'complex';
    maxCookingTime?: number;
    servingSize?: number;
    budgetLevel?: 'low' | 'medium' | 'high';
    caloriesPerDay?: number;
  };
}

// Shopping list types
export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  mealPlanId?: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
  recipeId?: string;
}

export interface CreateShoppingListRequest {
  name: string;
  mealPlanId?: string;
  items?: Omit<ShoppingListItem, 'id'>[];
}