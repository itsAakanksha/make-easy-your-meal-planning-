import { and, eq, like, ilike, or, inArray, gt, lt, isNull, count, sql, desc, asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './shared/schema';
import { RecipeSearchParams } from './src/services/recipe';

dotenv.config();

// Check if database connection string is set
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Warning: DATABASE_URL is not set in environment variables');
  console.error('Falling back to in-memory storage');
}

// Interface for storage operations
export interface IStorage {
  // User operations
  createUser(clerkUserId: string): Promise<any>;
  getUserByClerkId(clerkUserId: string): Promise<any>;
  
  // User profile operations
  getUserProfile(userId: number): Promise<any>;
  updateUserProfile(userId: number, data: any): Promise<any>;
  
  // Recipe operations
  getRecipeById(id: number): Promise<any>;
  searchRecipes(params: RecipeSearchParams): Promise<any[]>;
  getRandomRecipes(params: { number?: number; tags?: string[]; diet?: string; }): Promise<any[]>;
  createRecipe(data: any): Promise<any>;
  updateRecipe(id: number, data: any): Promise<any>;
  deleteRecipe(id: number): Promise<boolean>;
  
  // Saved recipe operations
  saveRecipe(userId: number, recipeId: number): Promise<boolean>;
  unsaveRecipe(userId: number, recipeId: number): Promise<boolean>;
  isRecipeSaved(userId: number, recipeId: number): Promise<boolean>;
  getSavedRecipes(userId: number): Promise<any[]>;
  
  // Meal plan operations
  createMealPlan(data: any): Promise<any>;
  getMealPlan(id: number): Promise<any>;
  getMealPlansByUserId(userId: number): Promise<any[]>;
  updateMealPlan(id: number, data: any): Promise<any>;
  deleteMealPlan(id: number): Promise<boolean>;
  
  // Meal operations
  createMeal(data: any): Promise<any>;
  getMealsByPlanId(mealPlanId: number): Promise<any[]>;
  updateMeal(id: number, data: any): Promise<any>;
  deleteMeal(id: number): Promise<boolean>;
  
  // Shopping list operations
  getShoppingList(userId: number, mealPlanId: number): Promise<any[]>;
  createShoppingListItem(data: any): Promise<any>;
  updateShoppingListItem(id: number, checked: boolean): Promise<any>;
  deleteShoppingListItem(id: number): Promise<boolean>;
  
  // Recipe cache operations (to be deprecated)
  getRecipeFromCache(id: string): Promise<any>;
  cacheRecipe(data: any): Promise<any>;

  // ID mapping operations
  cacheIdMapping(originalId: string, spoonacularId: string): Promise<any>;
  getSpoonacularIdFromMapping(originalId: string): Promise<string | null>;
}

// Class for database storage (PostgreSQL with Drizzle)
export class DBStorage implements IStorage {
  private db: any;
  
  constructor(connectionString: string) {
    const queryClient = postgres(connectionString);
    this.db = drizzle(queryClient, { schema });
  }
  
  // Run database migrations
  async runMigrations(migrationFolder = './drizzle') {
    const migrationClient = postgres(process.env.DATABASE_URL || '', { max: 1 });
    
    try {
      await migrate(drizzle(migrationClient), { migrationsFolder: migrationFolder });
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    } finally {
      await migrationClient.end();
    }
  }
  
  // User operations
  async createUser(clerkUserId: string): Promise<any> {
    try {
      const result = await this.db
        .insert(schema.users)
        .values({ clerkUserId, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error creating user with Clerk ID ${clerkUserId}:`, error);
      throw error;
    }
  }

  async getUserByClerkId(clerkUserId: string): Promise<any> {
    try {
      const result = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.clerkUserId, clerkUserId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error(`Error getting user by Clerk ID ${clerkUserId}:`, error);
      return null;
    }
  }
  
  // User profile operations
  async getUserProfile(userId: number): Promise<any> {
    try {
      const result = await this.db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, userId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error(`Error getting user profile for user ID ${userId}:`, error);
      return null;
    }
  }

  async updateUserProfile(userId: number, data: any): Promise<any> {
    try {
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        const result = await this.db
          .update(schema.userProfiles)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.userProfiles.id, existingProfile.id))
          .returning();
        return result[0];
      } else {
        const result = await this.db
          .insert(schema.userProfiles)
          .values({ userId, ...data, createdAt: new Date(), updatedAt: new Date() })
          .returning();
        return result[0];
      }
    } catch (error) {
      console.error(`Error updating user profile for user ID ${userId}:`, error);
      throw error;
    }
  }
  
  // Recipe operations
  async getRecipeById(id: number): Promise<any> {
    try {
      const recipes = await this.db
        .select()
        .from(schema.recipes)
        .where(eq(schema.recipes.id, id))
        .limit(1);
      
      return recipes[0] || null;
    } catch (error) {
      console.error(`Error getting recipe ID ${id}:`, error);
      return null;
    }
  }
  
  async searchRecipes(params: RecipeSearchParams): Promise<any[]> {
    try {
      let query = this.db
        .select()
        .from(schema.recipes);
      
      const conditions = [];
      
      // Add search conditions based on params
      if (params.query) {
        conditions.push(ilike(schema.recipes.title, `%${params.query}%`));
      }
      
      if (params.diet && params.diet !== 'any') {
        // Using JSON containment (jsonb @> array[])
        conditions.push(sql`${schema.recipes.diets} @> ${JSON.stringify([params.diet])}`);
      }
      
      if (params.cuisines?.length) {
        // Using JSON containment with any of the cuisines
        conditions.push(sql`${schema.recipes.diets} && ${JSON.stringify(params.cuisines)}`);
      }
      
      if (params.maxReadyTime) {
        conditions.push(lt(schema.recipes.readyInMinutes, params.maxReadyTime));
      }
      
      // Add more nutrition-based filters as needed
      
      // Apply all conditions if any exist
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Add limit and offset
      query = query.limit(params.number || 10);
      
      return await query;
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }
  
  async getRandomRecipes(params: { number?: number; tags?: string[]; diet?: string; }): Promise<any[]> {
    try {
      let query = this.db
        .select()
        .from(schema.recipes);
      
      const conditions = [];
      
      // Filter by diet if provided
      if (params.diet && params.diet !== 'any') {
        conditions.push(sql`${schema.recipes.diets} @> ${JSON.stringify([params.diet])}`);
      }
      
      // Filter by tags if provided
      if (params.tags?.length) {
        for (const tag of params.tags) {
          if (tag.includes('maxReadyTime=')) {
            const maxTime = parseInt(tag.split('=')[1]);
            if (!isNaN(maxTime)) {
              conditions.push(lt(schema.recipes.readyInMinutes, maxTime));
            }
          }
          // Add other tag handling as needed
        }
      }
      
      // Apply all conditions if any exist
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Order randomly
      query = query.orderBy(sql`RANDOM()`);
      
      // Add limit
      query = query.limit(params.number || 10);
      
      return await query;
    } catch (error) {
      console.error('Error getting random recipes:', error);
      return [];
    }
  }
  
  async createRecipe(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(schema.recipes)
        .values({
          title: data.title,
          image: data.image || '',
          readyInMinutes: data.readyInMinutes,
          servings: data.servings,
          instructions: data.instructions,
          nutrition: data.nutrition || { nutrients: [] },
          extendedIngredients: data.extendedIngredients || [],
          sourceName: data.sourceName,
          creditsText: data.creditsText,
          diets: data.diets || [],
          isDefault: data.isDefault || false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }
  
  async updateRecipe(id: number, data: any): Promise<any> {
    try {
      const result = await this.db
        .update(schema.recipes)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(schema.recipes.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error updating recipe ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteRecipe(id: number): Promise<boolean> {
    try {
      await this.db
        .delete(schema.recipes)
        .where(eq(schema.recipes.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting recipe ID ${id}:`, error);
      return false;
    }
  }
  
  // Saved recipe operations
  async saveRecipe(userId: number, recipeId: number): Promise<boolean> {
    try {
      // Check if it's already saved
      const existing = await this.db
        .select()
        .from(schema.savedRecipes)
        .where(
          and(
            eq(schema.savedRecipes.userId, userId),
            eq(schema.savedRecipes.recipeId, recipeId)
          )
        );
      
      if (existing.length > 0) {
        return true; // Already saved
      }
      
      // Save the recipe
      await this.db
        .insert(schema.savedRecipes)
        .values({
          userId,
          recipeId,
          createdAt: new Date()
        });
      
      return true;
    } catch (error) {
      console.error(`Error saving recipe ID ${recipeId} for user ${userId}:`, error);
      return false;
    }
  }
  
  async unsaveRecipe(userId: number, recipeId: number): Promise<boolean> {
    try {
      await this.db
        .delete(schema.savedRecipes)
        .where(
          and(
            eq(schema.savedRecipes.userId, userId),
            eq(schema.savedRecipes.recipeId, recipeId)
          )
        );
      
      return true;
    } catch (error) {
      console.error(`Error unsaving recipe ID ${recipeId} for user ${userId}:`, error);
      return false;
    }
  }
  
  async isRecipeSaved(userId: number, recipeId: number): Promise<boolean> {
    try {
      const result = await this.db
        .select()
        .from(schema.savedRecipes)
        .where(
          and(
            eq(schema.savedRecipes.userId, userId),
            eq(schema.savedRecipes.recipeId, recipeId)
          )
        );
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error checking if recipe ID ${recipeId} is saved for user ${userId}:`, error);
      return false;
    }
  }
  
  async getSavedRecipes(userId: number): Promise<any[]> {
    try {
      // Join saved_recipes with recipes to get full recipe data
      const result = await this.db
        .select({
          savedRecipe: schema.savedRecipes,
          recipe: schema.recipes
        })
        .from(schema.savedRecipes)
        .innerJoin(
          schema.recipes,
          eq(schema.savedRecipes.recipeId, schema.recipes.id)
        )
        .where(eq(schema.savedRecipes.userId, userId));
      
      // Transform the result to a better format
      return result.map((row: { savedRecipe: any; recipe: any }) => ({
        id: row.recipe.id,
        title: row.recipe.title,
        image: row.recipe.image,
        readyInMinutes: row.recipe.readyInMinutes,
        servings: row.recipe.servings,
        isFavorite: row.savedRecipe.isFavorite,
        source: row.recipe.sourceName
      }));
    } catch (error) {
      console.error(`Error getting saved recipes for user ${userId}:`, error);
      return [];
    }
  }
  
  // Meal plan operations
  async createMealPlan(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(schema.mealPlans)
        .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating meal plan:', error);
      throw error;
    }
  }

  async getMealPlan(id: number): Promise<any> {
    try {
      const result = await this.db
        .select()
        .from(schema.mealPlans)
        .where(eq(schema.mealPlans.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error(`Error getting meal plan ID ${id}:`, error);
      return null;
    }
  }

  async getMealPlansByUserId(userId: number): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(schema.mealPlans)
        .where(eq(schema.mealPlans.userId, userId));
    } catch (error) {
      console.error(`Error getting meal plans for user ID ${userId}:`, error);
      return [];
    }
  }

  async updateMealPlan(id: number, data: any): Promise<any> {
    try {
      const result = await this.db
        .update(schema.mealPlans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.mealPlans.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating meal plan ID ${id}:`, error);
      throw error;
    }
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    try {
      await this.db
        .delete(schema.mealPlans)
        .where(eq(schema.mealPlans.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting meal plan ID ${id}:`, error);
      return false;
    }
  }

  // Meal operations
  async createMeal(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(schema.meals)
        .values({ ...data, createdAt: new Date() })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating meal:', error);
      throw error;
    }
  }

  async getMealsByPlanId(mealPlanId: number): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(schema.meals)
        .where(eq(schema.meals.mealPlanId, mealPlanId));
    } catch (error) {
      console.error(`Error getting meals for meal plan ID ${mealPlanId}:`, error);
      return [];
    }
  }

  async updateMeal(id: number, data: any): Promise<any> {
    try {
      const result = await this.db
        .update(schema.meals)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.meals.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating meal ID ${id}:`, error);
      throw error;
    }
  }

  async deleteMeal(id: number): Promise<boolean> {
    try {
      await this.db
        .delete(schema.meals)
        .where(eq(schema.meals.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting meal ID ${id}:`, error);
      return false;
    }
  }

  // Shopping list operations
  async getShoppingList(userId: number, mealPlanId: number): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(schema.shoppingListItems)
        .where(
          and(
            eq(schema.shoppingListItems.userId, userId),
            eq(schema.shoppingListItems.mealPlanId, mealPlanId)
          )
        );
    } catch (error) {
      console.error(`Error getting shopping list for user ID ${userId} and meal plan ID ${mealPlanId}:`, error);
      return [];
    }
  }

  async createShoppingListItem(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(schema.shoppingListItems)
        .values({ ...data, createdAt: new Date(), checked: false })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating shopping list item:', error);
      throw error;
    }
  }

  async updateShoppingListItem(id: number, checked: boolean): Promise<any> {
    try {
      const result = await this.db
        .update(schema.shoppingListItems)
        .set({ checked })
        .where(eq(schema.shoppingListItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating shopping list item ID ${id}:`, error);
      throw error;
    }
  }

  async deleteShoppingListItem(id: number): Promise<boolean> {
    try {
      await this.db
        .delete(schema.shoppingListItems)
        .where(eq(schema.shoppingListItems.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting shopping list item ID ${id}:`, error);
      return false;
    }
  }

  // Recipe cache operations (to be deprecated)
  async getRecipeFromCache(id: string): Promise<any> {
    try {
      const result = await this.db
        .select()
        .from(schema.recipeCache)
        .where(eq(schema.recipeCache.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error(`Error getting recipe from cache ID ${id}:`, error);
      return null;
    }
  }

  async cacheRecipe(data: any): Promise<any> {
    try {
      const result = await this.db
        .insert(schema.recipeCache)
        .values({ ...data, cachedAt: new Date() })
        .onConflictDoUpdate({
          target: schema.recipeCache.id,
          set: { data: data.data, cachedAt: new Date() }
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error caching recipe:', error);
      throw error;
    }
  }

  // ID mapping operations
  async cacheIdMapping(originalId: string, spoonacularId: string): Promise<any> {
    try {
      const idMappingKey = `id_mapping_${originalId}`;
      
      const result = await this.db
        .insert(schema.recipeCache)
        .values({ 
          id: idMappingKey, 
          data: { 
            originalId,
            spoonacularId,
            type: 'id_mapping'
          }, 
          cachedAt: new Date() 
        })
        .onConflictDoUpdate({
          target: schema.recipeCache.id,
          set: { 
            data: { 
              originalId,
              spoonacularId,
              type: 'id_mapping'
            }, 
            cachedAt: new Date() 
          }
        })
        .returning();
        
      console.log(`Created ID mapping: ${originalId} -> ${spoonacularId}`);
      return result[0];
    } catch (error) {
      console.error(`Error creating ID mapping ${originalId} -> ${spoonacularId}:`, error);
      throw error;
    }
  }
  
  async getSpoonacularIdFromMapping(originalId: string): Promise<string | null> {
    try {
      const idMappingKey = `id_mapping_${originalId}`;
      const result = await this.db
        .select()
        .from(schema.recipeCache)
        .where(eq(schema.recipeCache.id, idMappingKey))
        .limit(1);
        
      if (result[0] && result[0].data.type === 'id_mapping') {
        return result[0].data.spoonacularId;
      }
      
      return null;
    } catch (error) {
      console.error(`Error looking up Spoonacular ID for original ID ${originalId}:`, error);
      return null;
    }
  }
}

// Check if DATABASE_URL is set and create appropriate storage instance
let storage: IStorage;

try {
  if (databaseUrl) {
    storage = new DBStorage(databaseUrl);
    console.log('Using PostgreSQL database for storage');
  } else {
    console.error('Database URL is required for DBStorage');
    throw new Error('Database URL is required for DBStorage');
  }
} catch (error) {
  console.error('Error initializing database storage:', error);
  throw error;
}

export { storage };
