/**
 * Shared schema definitions for the application
 * This file contains common types and interfaces used across the application
 */

// User related schemas
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Recipe related schemas
export interface Recipe {
  id: number;
  title: string;
  image?: string;
  sourceUrl?: string;
  servings: number;
  readyInMinutes: number;
  diets?: string[];
  dishTypes?: string[];
  occasions?: string[];
}

// Meal Plan related schemas
export interface MealPlan {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  recipeId: number;
  title: string;
  mealType: MealType;
  servings: number;
}

export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack'
}

// Shopping list related schemas
export interface ShoppingListItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  recipeId?: number;
  category?: string;
}

// User preferences
export interface UserPreferences {
  userId: string;
  diet?: string;
  allergies?: string[];
  excludeIngredients?: string[];
  cuisinePreferences?: string[];
  mealCount: number;
  servings: number;
  cookingTime?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
}

// Storage related types
export interface StorageOptions {
  tableName: string;
  indexName?: string;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}