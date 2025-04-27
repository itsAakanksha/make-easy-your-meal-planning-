import { Request, Response } from 'express';
import { ApiError } from '../utils/error.classes';
import { db } from '../db';
import { users, userPreferences, userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Define a schema for validating user preference data
const userPreferenceSchema = z.object({
  diet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dislikes: z.array(z.string()).optional(),
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
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      // Find the user and their profile and preferences
      const userData = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
        with: {
          profile: true,
          preferences: true
        }
      });

      if (!userData) {
        throw new ApiError('User not found', 404);
      }

      // Remove sensitive data
      const { clerkUserId: _, ...safeUserData } = userData;
      
      return res.status(200).json({
        success: true,
        user: safeUserData
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to get user profile' });
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
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      // Validate the request body
      const validationResult = userPreferenceSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ApiError('Invalid preference data: ' + validationResult.error.message, 400);
      }

      const preferenceData = validationResult.data;

      // Find the internal user ID
      const userResult = await db.select({ id: users.id })
                                .from(users)
                                .where(eq(users.clerkUserId, clerkUserId));

      if (!userResult || userResult.length === 0) {
        throw new ApiError('User not found', 404);
      }
      
      const internalUserId = userResult[0].id;

      // Upsert the preferences
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

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to update user preferences' });
    }
  }
};