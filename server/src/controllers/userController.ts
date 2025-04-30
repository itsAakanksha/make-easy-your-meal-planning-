import { Request, Response } from 'express';
import { ApiError } from '../utils/error.classes';
import { db } from '../db';
import { users, userPreferences, userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { validateUserData, validateUserPreferences } from '../utils/dataValidation';

// Define a schema for validating user preference data
const userPreferenceSchema = z.object({
  diet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dislikes: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  goals: z.object({
    targetCalories: z.number().positive().optional(),
    targetProtein: z.number().positive().optional(),
    targetCarbs: z.number().positive().optional(),
    targetFat: z.number().positive().optional(),
    goalType: z.string().optional(),
  }).optional(),
  maxPrepTime: z.number().positive().optional(),
  mealCount: z.number().int().min(1).max(6).default(3)
});

export const userController = {
  /**
   * Get the current user's profile and preferences
   * Flow 1: Fetching User Profile & Preferences
   */
  getUserProfile: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      console.log(`📋 User Controller (getUserProfile): Request for user profile of clerk ID ${clerkUserId}`);
      
      if (!clerkUserId) {
        console.log(`❌ User Controller (getUserProfile): No userId found in request`);
        throw new ApiError('Unauthorized', 401);
      }

      // Find the user and their profile and preferences
      console.log(`🔍 User Controller (getUserProfile): Fetching user data for clerkUserId ${clerkUserId}`);
      const userData = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
        with: {
          profile: true,
          preferences: true
        }
      });

      if (!userData) {
        console.log(`❌ User Controller (getUserProfile): User not found for clerkUserId ${clerkUserId}`);
        throw new ApiError('User not found', 404);
      }

      console.log(`✅ User Controller (getUserProfile): Found user ${userData.id} with profile and preferences`);
      
      // Remove sensitive data
      const { clerkUserId: _, ...safeUserData } = userData;
      
      return res.status(200).json({
        success: true,
        user: safeUserData
      });
    } catch (error) {
      console.error(`❌ User Controller (getUserProfile): Error getting user profile:`, error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  /**
   * Get only the user preferences
   * This is used by the client preferences page
   */
  getUserPreferences: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      console.log(`📋 User Controller (getUserPreferences): Request for preferences of clerk ID ${clerkUserId}`);
      
      if (!clerkUserId) {
        console.log(`❌ User Controller (getUserPreferences): No userId found in request`);
        throw new ApiError('Unauthorized', 401);
      }

      // Find the user ID
      console.log(`🔍 User Controller (getUserPreferences): Finding internal user ID for clerkUserId ${clerkUserId}`);
      const userResult = await db.select({ id: users.id })
                                .from(users)
                                .where(eq(users.clerkUserId, clerkUserId));

      if (!userResult || userResult.length === 0) {
        console.log(`❌ User Controller (getUserPreferences): User not found for clerkUserId ${clerkUserId}`);
        throw new ApiError('User not found', 404);
      }
      
      const internalUserId = userResult[0].id;
      console.log(`✅ User Controller (getUserPreferences): Found internal user ID ${internalUserId}`);

      // Get user preferences
      console.log(`🔍 User Controller (getUserPreferences): Fetching preferences for user ID ${internalUserId}`);
      const userPrefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, internalUserId)
      });

      if (!userPrefs) {
        console.log(`⚠️ User Controller (getUserPreferences): No preferences found for user ID ${internalUserId}, creating defaults`);
        // If no preferences exist, create default preferences
        const defaultPreferences = {
          diet: null,
          allergies: [],
          dislikes: [],
          cuisinePreferences: [],
          goals: {
            targetCalories: 2000,
            targetProtein: 100,
            targetCarbs: 250,
            targetFat: 70,
            goalType: 'maintain'
          },
          maxPrepTime: 60,
          mealCount: 3
        };

        // Insert default preferences
        console.log(`📝 User Controller (getUserPreferences): Creating default preferences for user ID ${internalUserId}`);
        await db.insert(userPreferences)
          .values({
            userId: internalUserId,
            ...defaultPreferences,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        console.log(`✅ User Controller (getUserPreferences): Default preferences successfully created in database for user ID ${internalUserId}`);

        console.log(`✅ User Controller (getUserPreferences): Created default preferences for user ID ${internalUserId}`);
        return res.status(200).json({
          success: true,
          preferences: defaultPreferences
        });
      }

      console.log(`✅ User Controller (getUserPreferences): Returning preferences for user ID ${internalUserId}`);
      return res.status(200).json({
        success: true,
        preferences: userPrefs
      });
    } catch (error) {
      console.error(`❌ User Controller (getUserPreferences): Error getting user preferences:`, error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to get user preferences' });
    }
  },

  /**
   * Update the current user's preferences
   * Flow 2: Updating User Preferences
   */
  updateUserPreferences: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      console.log(`📋 User Controller (updateUserPreferences): Request to update preferences for clerk ID ${clerkUserId}`);
      console.log(`📋 User Controller (updateUserPreferences): Request body:`, req.body);
      
      if (!clerkUserId) {
        console.log(`❌ User Controller (updateUserPreferences): No userId found in request`);
        throw new ApiError('Unauthorized', 401);
      }

      // Validate the request body
      const validationResult = userPreferenceSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log(`❌ User Controller (updateUserPreferences): Invalid preference data:`, validationResult.error);
        throw new ApiError('Invalid preference data: ' + validationResult.error.message, 400);
      }

      const preferenceData = validationResult.data;
      console.log(`✅ User Controller (updateUserPreferences): Data validation passed`);

      // Find the internal user ID
      console.log(`🔍 User Controller (updateUserPreferences): Finding internal user ID for clerkUserId ${clerkUserId}`);
      const userResult = await db.select({ id: users.id, email: users.email })
                                .from(users)
                                .where(eq(users.clerkUserId, clerkUserId));

      if (!userResult || userResult.length === 0) {
        console.log(`❌ User Controller (updateUserPreferences): User not found for clerkUserId ${clerkUserId}`);
        throw new ApiError('User not found', 404);
      }
      
      const internalUserId = userResult[0].id;
      const email = userResult[0].email;
      console.log(`✅ User Controller (updateUserPreferences): Found internal user ID ${internalUserId}`);

      // Upsert the preferences
      console.log(`📝 User Controller (updateUserPreferences): Upserting preferences for user ID ${internalUserId}`);
      await db.insert(userPreferences)
        .values({
          userId: internalUserId,
          ...preferenceData,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            ...preferenceData,
            updatedAt: new Date()
          }
        });
      console.log(`✅ User Controller (updateUserPreferences): User preferences successfully upserted in database for user ID ${internalUserId}`);

      // Validate preferences were saved correctly
      console.log(`🔍 User Controller (updateUserPreferences): Validating preferences were saved correctly`);
      const validationSucceeded = await validateUserPreferences(internalUserId, preferenceData);
      
      if (!validationSucceeded) {
        console.warn(`⚠️ User Controller (updateUserPreferences): User preferences validation failed for user ${clerkUserId}`);
      } else {
        console.log(`✅ User Controller (updateUserPreferences): Preferences validated successfully`);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        validated: validationSucceeded
      });
    } catch (error) {
      console.error(`❌ User Controller (updateUserPreferences): Error updating user preferences:`, error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to update user preferences' });
    }
  },
  
  /**
   * Validate data integrity for the current user
   * This is a utility endpoint to check data is correctly saved and retrieved
   */
  validateUser: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      console.log(`📋 User Controller (validateUser): Request to validate user data for clerk ID ${clerkUserId}`);
      
      if (!clerkUserId) {
        console.log(`❌ User Controller (validateUser): No userId found in request`);
        throw new ApiError('Unauthorized', 401);
      }
      
      // Get internal user ID
      console.log(`🔍 User Controller (validateUser): Finding internal user ID for clerkUserId ${clerkUserId}`);
      const userResult = await db.select({ id: users.id, email: users.email })
                                .from(users)
                                .where(eq(users.clerkUserId, clerkUserId));
      
      if (!userResult || userResult.length === 0) {
        console.log(`❌ User Controller (validateUser): User not found for clerkUserId ${clerkUserId}`);
        throw new ApiError('User not found', 404);
      }
      
      const internalUserId = userResult[0].id;
      const email = userResult[0].email;
      console.log(`✅ User Controller (validateUser): Found internal user ID ${internalUserId}`);
      
      // Run validation checks
      console.log(`🔍 User Controller (validateUser): Running validation checks for user ${internalUserId}`);
      const validationResults = await validateUserData(clerkUserId, internalUserId, email);
      console.log(`📋 User Controller (validateUser): Validation results:`, validationResults);
      
      return res.status(200).json({
        success: true,
        validation: validationResults,
        allValid: Object.values(validationResults).every(val => val)
      });
    } catch (error) {
      console.error(`❌ User Controller (validateUser): Error validating user data:`, error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to validate user data' });
    }
  }
};