/**
 * Data validation utilities for ensuring data integrity
 * This file contains helpers to validate data is correctly stored and retrieved
 */

import { db } from '../db';
import { users, userProfiles, userPreferences, mealPlans, recipeEmbeddings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { findSimilarVectors, storeEmbedding } from './vectorDb.client';
import { generateEmbedding } from './embedding.generator';
import { ApiError } from './error.classes';

/**
 * Validate a user was correctly created in the database
 * @param clerkUserId - The Clerk user ID
 * @param email - The user's email address
 */
export async function validateUserCreation(clerkUserId: string, email: string): Promise<boolean> {
  try {
    console.log(`🔍 Data Validation: Validating user creation for Clerk ID ${clerkUserId}`);
    
    // Check user exists in database
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId)
    });

    if (!userRecord) {
      console.error(`❌ Data Validation: User validation failed: User ${clerkUserId} not found in database`);
      return false;
    }

    // Check email matches
    if (userRecord.email !== email) {
      console.error(`❌ Data Validation: User validation failed: Email mismatch for user ${clerkUserId}`);
      console.error(`❌ Data Validation: Expected "${email}" but found "${userRecord.email}"`);
      return false;
    }

    console.log(`✅ Data Validation: User validation passed for ${clerkUserId} with ID ${userRecord.id}`);
    return true;
  } catch (error) {
    console.error('❌ Data Validation: Error validating user creation:', error);
    return false;
  }
}

/**
 * Validate a user profile was correctly stored and can be retrieved
 * @param userId - The internal user ID
 * @param expectedFields - Fields that should exist on the profile
 */
export async function validateUserProfile(
  userId: number,
  expectedFields: Partial<typeof userProfiles.$inferSelect> = {}
): Promise<boolean> {
  try {
    console.log(`🔍 Data Validation: Validating user profile for user ID ${userId}`);
    
    // Check user profile exists
    const profileRecord = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId)
    });

    if (!profileRecord) {
      console.error(`❌ Data Validation: Profile validation failed: No profile found for user ID ${userId}`);
      return false;
    }

    // Only validate fields that were specified (if any)
    const fieldsToCheck = Object.keys(expectedFields);
    if (fieldsToCheck.length > 0) {
      console.log(`🔍 Data Validation: Checking expected fields: ${fieldsToCheck.join(', ')}`);
      
      for (const key of fieldsToCheck) {
        const expectedValue = expectedFields[key as keyof typeof expectedFields];
        const actualValue = profileRecord[key as keyof typeof profileRecord];

        if (expectedValue !== actualValue) {
          console.error(`❌ Data Validation: Profile validation failed: Field "${key}" mismatch for user ID ${userId}`);
          console.error(`❌ Data Validation: Expected "${expectedValue}" but found "${actualValue}"`);
          return false;
        }
      }
    }

    console.log(`✅ Data Validation: User profile validation passed for user ID ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Data Validation: Error validating user profile:', error);
    return false;
  }
}

/**
 * Validate user preferences were correctly stored and can be retrieved
 * @param userId - The internal user ID
 * @param expectedPrefs - Expected preference values to validate against
 */
export async function validateUserPreferences(
  userId: number,
  expectedPrefs: Partial<typeof userPreferences.$inferSelect> = {}
): Promise<boolean> {
  try {
    // Fetch the user preferences
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId)
    });

    if (!prefs) {
      console.error(`❌ Preferences validation failed: No preferences found for user ID ${userId}`);
      return false;
    }

    // Check simple field equality for non-array fields
    for (const [key, value] of Object.entries(expectedPrefs)) {
      // Special handling for JSON fields (arrays and objects)
      if (Array.isArray(value)) {
        const dbValue = prefs[key as keyof typeof prefs] as unknown as any[];
        
        // Check array contents match (regardless of order)
        const dbValSet = new Set(dbValue);
        for (const item of value) {
          if (!dbValSet.has(item)) {
            console.error(`❌ Preferences validation failed: Array field "${key}" missing item "${item}" for user ID ${userId}`);
            return false;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle JSON objects by checking contained key/values match
        const dbValue = prefs[key as keyof typeof prefs] as unknown as Record<string, any>;
        
        for (const [objKey, objVal] of Object.entries(value)) {
          if (dbValue[objKey] !== objVal) {
            console.error(`❌ Preferences validation failed: Object field "${key}.${objKey}" mismatch for user ID ${userId}`);
            return false;
          }
        }
      } else if (prefs[key as keyof typeof prefs] !== value) {
        // Simple equality check for primitive values
        console.error(`❌ Preferences validation failed: Field "${key}" mismatch for user ID ${userId}`);
        return false;
      }
    }

    console.log(`✅ Preferences validation passed for user ID ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error validating user preferences:', error);
    return false;
  }
}

/**
 * Validate a meal plan was correctly stored and can be retrieved
 * @param mealPlanId - The meal plan ID
 * @param userId - The user ID associated with the meal plan
 */
export async function validateMealPlan(mealPlanId: number, userId: number): Promise<boolean> {
  try {
    // Fetch the meal plan
    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, mealPlanId)
    });

    if (!mealPlan) {
      console.error(`❌ Meal plan validation failed: Meal plan ${mealPlanId} not found in database`);
      return false;
    }

    // Verify meal plan belongs to the correct user
    if (mealPlan.userId !== userId) {
      console.error(`❌ Meal plan validation failed: Meal plan ${mealPlanId} belongs to user ${mealPlan.userId}, not ${userId}`);
      return false;
    }

    // Verify meal plan structure
    const planData = mealPlan.planData;
    
    // Check required properties exist
    if (!planData.timeFrame || !planData.meals || !Array.isArray(planData.meals)) {
      console.error(`❌ Meal plan validation failed: Missing required properties in meal plan ${mealPlanId}`);
      return false;
    }

    // Check that each meal has the required properties
    for (const meal of planData.meals) {
      if (!meal.id || !meal.recipeId || !meal.mealType || !meal.title || !meal.date) {
        console.error(`❌ Meal plan validation failed: Incomplete meal in meal plan ${mealPlanId}`);
        return false;
      }
    }

    console.log(`✅ Meal plan validation passed for meal plan ${mealPlanId}`);
    return true;
  } catch (error) {
    console.error('❌ Error validating meal plan:', error);
    return false;
  }
}

/**
 * Validate recipe embeddings are correctly stored and can be retrieved
 * @param recipeId - The Spoonacular recipe ID
 * @param recipeTitle - The recipe title (for generating embeddings)
 */
export async function validateRecipeEmbedding(recipeId: number, recipeTitle: string): Promise<boolean> {
  try {
    // Check if the recipe embedding exists in the database
    const embedding = await db.query.recipeEmbeddings.findFirst({
      where: eq(recipeEmbeddings.spoonacularId, recipeId)
    });

    if (!embedding) {
      console.error(`❌ Recipe embedding validation failed: No embedding found for recipe ID ${recipeId}`);
      return false;
    }

    // Verify we can do a semantic search that returns this recipe
    // Generate a query embedding for the recipe title
    const queryEmbedding = await generateEmbedding(recipeTitle);
    if (!queryEmbedding || !queryEmbedding.length) {
      console.error(`❌ Recipe embedding validation failed: Could not generate query embedding for recipe "${recipeTitle}"`);
      return false;
    }

    // Search for similar recipes
    const similarRecipes = await findSimilarVectors(queryEmbedding, 10);
    
    // Check if our recipe is among the results
    const isFound = similarRecipes.some(r => parseInt(r.id) === recipeId);
    
    if (!isFound) {
      console.error(`❌ Recipe embedding validation failed: Could not retrieve recipe ${recipeId} by semantic search`);
      return false;
    }

    console.log(`✅ Recipe embedding validation passed for recipe ${recipeId}`);
    return true;
  } catch (error) {
    console.error('❌ Error validating recipe embedding:', error);
    return false;
  }
}

/**
 * Run validation on all critical data for a user
 * @param clerkUserId - The Clerk user ID
 * @param userId - The internal user ID
 */
export async function validateUserData(clerkUserId: string, userId: number, email: string): Promise<{
  userCreation: boolean;
  userProfile: boolean;
  userPreferences: boolean;
}> {
  const results = {
    userCreation: await validateUserCreation(clerkUserId, email),
    userProfile: await validateUserProfile(userId),
    userPreferences: await validateUserPreferences(userId)
  };

  const allValid = Object.values(results).every(result => result);
  
  if (allValid) {
    console.log(`✅ All validation checks passed for user ${clerkUserId}`);
  } else {
    console.error(`❌ Some validation checks failed for user ${clerkUserId}`);
  }

  return results;
}