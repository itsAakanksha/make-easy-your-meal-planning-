import { pgTable, text, serial, integer, jsonb, timestamp, primaryKey, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define RecipeData interface for proper typing
export interface RecipeData {
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  instructions: string;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  extendedIngredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    aisle: string;
  }>;
  sourceName?: string;
  creditsText?: string;
  diets?: string[];
  [key: string]: any; // Allow other properties
}

// Updated users table to link with Clerk
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Separate table for detailed user profiles
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name"),
  email: text("email"),
  // Detailed preferences
  diet: text("diet"), // vegetarian, vegan, keto, etc.
  allergies: jsonb("allergies").$type<string[]>(),
  dislikes: jsonb("dislikes").$type<string[]>(),
  cuisinePreferences: jsonb("cuisine_preferences").$type<string[]>(),
  goalType: text("goal_type"), // weight loss, muscle gain, maintenance
  calorieTarget: integer("calorie_target"),
  proteinTarget: integer("protein_target"),
  carbTarget: integer("carb_target"),
  fatTarget: integer("fat_target"),
  mealCount: integer("meal_count").default(3),
  budgetPerMeal: integer("budget_per_meal"), // in cents
  cookingTime: integer("cooking_time"), // in minutes
  servings: integer("servings").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Our own recipes table
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  image: text("image"),
  readyInMinutes: integer("ready_in_minutes").notNull(),
  servings: integer("servings").notNull(),
  instructions: text("instructions").notNull(),
  nutrition: jsonb("nutrition").$type<{ nutrients: Array<{ name: string; amount: number; unit: string }> }>(),
  extendedIngredients: jsonb("extended_ingredients").$type<Array<{ id: number; name: string; amount: number; unit: string; aisle: string }>>(),
  sourceName: text("source_name"),
  creditsText: text("credits_text"),
  diets: jsonb("diets").$type<string[]>(),
  isDefault: boolean("is_default").default(false), // Flag for pre-populated recipes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  name: text("name"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New table for individual meals within a plan
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").notNull().references(() => mealPlans.id),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id), // Changed from string to integer reference
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  readyInMinutes: integer("ready_in_minutes"),
  servings: integer("servings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipe cache to minimize Spoonacular API calls
export const recipeCache = pgTable("recipe_cache", {
  id: text("id").primaryKey(), // Spoonacular recipe ID
  data: jsonb("data").$type<RecipeData>().notNull(), // Full recipe data
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

// New table for storing user's saved recipes
export const savedRecipes = pgTable("saved_recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id), // Changed from string to integer reference
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shopping list items generated from meal plans
export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id),
  name: text("name").notNull(),
  amount: text("amount"),
  unit: text("unit"),
  category: text("category"), // produce, dairy, meat, etc.
  checked: boolean("checked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validation helpers
export const insertUserSchema = createInsertSchema(users);
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const insertMealPlanSchema = createInsertSchema(mealPlans);
export const insertMealSchema = createInsertSchema(meals);
export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems);

// Inferred types
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type RecipeCache = typeof recipeCache.$inferSelect;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
