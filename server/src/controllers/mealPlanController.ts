import { Request, Response } from 'express';
import { ApiError } from '../utils/error.classes';
import { db } from '../db';
import { users, userPreferences, mealPlans } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { selectMeals } from '../utils/mealPlanningAlgorithm';
import { searchRecipes, RecipeSearchParams } from '../utils/spoonacular.client';

// Add type for nutrition data
interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define type for preferences with correct property types
interface UserPreferencesType {
  id: number;
  userId: number;
  diet: string | null;
  allergies: string[] | null;
  dislikes: string[] | null;
  cuisinePreferences: string[] | null;
  goals: {
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    goalType?: string;
  } | null;
  maxPrepTime: number | null;
  mealCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define validation schema for meal plan generation request
const mealPlanGenerateSchema = z.object({
  timeFrame: z.enum(['day', 'week']),
  targetCalories: z.number().positive().optional(),
  diet: z.string().optional(),
  exclude: z.array(z.string()).optional(),
  preferences: z.object({
    cuisines: z.array(z.string()).optional(),
    mealCount: z.number().int().min(1).max(6).optional(),
    readyTime: z.number().int().positive().optional()
  }).optional(),
  useUserPreferences: z.boolean().default(true)
});

export const mealPlanController = {
  /**
   * Generate a meal plan based on user preferences and request parameters
   * Flow 5: Meal Plan Generation
   */
  generateMealPlan: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      // Validate request body
      const validationResult = mealPlanGenerateSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ApiError(`Invalid meal plan parameters: ${validationResult.error.message}`, 400);
      }

      const { timeFrame, targetCalories, diet, exclude, preferences, useUserPreferences } = validationResult.data;

      // Find internal user ID
      const user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
        with: {
          preferences: true
        }
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Get user preferences if requested
      const userPrefs = useUserPreferences ? user.preferences : null;

      // Combine request parameters with user preferences
      // Using undefined instead of null to match RecipeSearchParams type
      const effectiveDiet = diet || (userPrefs?.diet || undefined);
      const effectiveExclude = exclude || [];
      
      // Add allergies from user preferences if enabled
      if (useUserPreferences && userPrefs?.allergies && userPrefs.allergies.length > 0) {
        effectiveExclude.push(...userPrefs.allergies);
      }
      
      // Add dislikes from user preferences if enabled
      if (useUserPreferences && userPrefs?.dislikes && userPrefs.dislikes.length > 0) {
        effectiveExclude.push(...userPrefs.dislikes);
      }
      
      // Determine meal count and other parameters
      const effectiveMealCount = preferences?.mealCount || userPrefs?.mealCount || 3;
      const effectiveCuisines = preferences?.cuisines || (userPrefs?.cuisinePreferences || []);
      const effectiveTargetCalories = targetCalories || (userPrefs?.goals?.targetCalories) || 2000;
      const effectiveMaxReadyTime = preferences?.readyTime || userPrefs?.maxPrepTime || 60;

      // Calculate dates for the meal plan
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      if (timeFrame === 'week') {
        endDate.setDate(endDate.getDate() + 6); // 7 days including start date
      }

      // Step 1: Get candidate recipes using basic filters
      const searchParams: RecipeSearchParams = {
        diet: effectiveDiet !== null ? effectiveDiet : undefined,
        excludeIngredients: effectiveExclude,
        cuisines: effectiveCuisines.length > 0 ? effectiveCuisines : undefined,
        maxReadyTime: effectiveMaxReadyTime,
        number: timeFrame === 'day' ? effectiveMealCount * 5 : effectiveMealCount * 7 * 3 // Get more recipes than needed for variety
      };

      console.log('Searching for candidate recipes with params:', searchParams);
      const candidateRecipes = await searchRecipes(searchParams);

      if (!candidateRecipes || candidateRecipes.length === 0) {
        throw new ApiError('No recipes found matching your criteria. Try relaxing some constraints.', 404);
      }

      console.log(`Found ${candidateRecipes.length} candidate recipes`);

      // Step 2: Choose specific meals and build the plan using our algorithm
      // Ensure diet is undefined instead of null to match MealPreferences type
      const mealPreferences = {
        diet: effectiveDiet !== null ? effectiveDiet : undefined,
        allergies: effectiveExclude,
        targetCalories: effectiveTargetCalories,
        mealCount: effectiveMealCount,
        maxPrepTime: effectiveMaxReadyTime,
        timeFrame: timeFrame
      };

      // Use our custom meal planning algorithm
      const selectedMeals = await selectMeals(candidateRecipes, mealPreferences, timeFrame);

      // Format meals to store in the database
      const formattedMeals = selectedMeals.map((meal, index) => ({
        id: `${meal.id}_${index}`,
        recipeId: meal.id,
        mealType: meal.mealType,
        title: meal.title,
        imageUrl: meal.image,
        readyInMinutes: meal.readyInMinutes,
        servings: meal.servings,
        date: meal.date
      }));

      // Calculate nutrition summary if available
      const nutritionSummary = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      // Sum up nutritional values from selected meals if available
      selectedMeals.forEach(meal => {
        if (meal.nutrition) {
          nutritionSummary.calories += (meal.nutrition.nutrients.find(n => n.name.toLowerCase() === 'calories')?.amount || 0);
          nutritionSummary.protein += (meal.nutrition.nutrients.find(n => n.name.toLowerCase() === 'protein')?.amount || 0);
          nutritionSummary.carbs += (meal.nutrition.nutrients.find(n => n.name.toLowerCase() === 'carbs' || n.name.toLowerCase() === 'carbohydrates')?.amount || 0);
          nutritionSummary.fat += (meal.nutrition.nutrients.find(n => n.name.toLowerCase() === 'fat')?.amount || 0);
        }
      });

      // Create the meal plan in the database
      const planData = {
        timeFrame,
        meals: formattedMeals,
        nutritionSummary
      };

      const insertedPlan = await db.insert(mealPlans)
        .values({
          userId: user.id,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          planData: planData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({
          id: mealPlans.id
        });

      if (!insertedPlan.length) {
        throw new ApiError('Failed to create meal plan', 500);
      }

      return res.status(201).json({
        success: true,
        id: insertedPlan[0].id,
        mealPlan: {
          id: insertedPlan[0].id,
          timeFrame,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          meals: formattedMeals
        }
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to generate meal plan' });
    }
  },

  /**
   * Get all meal plans for the current user
   * Flow 6: Retrieving Saved Meal Plans
   */
  getUserMealPlans: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      // Find internal user ID
      const user = await db.query.users.findFirst({
        columns: { id: true },
        where: eq(users.clerkUserId, clerkUserId)
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Query meal plans, ordered by creation date (newest first)
      const userMealPlans = await db.select({
        id: mealPlans.id,
        startDate: mealPlans.startDate,
        endDate: mealPlans.endDate,
        timeFrame: sql`(meal_plans.plan_data->>'timeFrame')::text`,
        isActive: mealPlans.isActive,
        isFavorite: mealPlans.isFavorite,
        createdAt: mealPlans.createdAt,
        updatedAt: mealPlans.updatedAt
      })
      .from(mealPlans)
      .where(eq(mealPlans.userId, user.id))
      .orderBy(desc(mealPlans.createdAt));

      return res.status(200).json({
        success: true,
        mealPlans: userMealPlans
      });
    } catch (error) {
      console.error('Error getting user meal plans:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to get meal plans' });
    }
  },

  /**
   * Get meal plan details by ID
   * Flow 6: Retrieving Saved Meal Plans
   */
  getMealPlanById: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      const { id } = req.params;
      const planId = parseInt(id);
      
      if (isNaN(planId)) {
        throw new ApiError('Invalid meal plan ID', 400);
      }

      // Find internal user ID
      const user = await db.query.users.findFirst({
        columns: { id: true },
        where: eq(users.clerkUserId, clerkUserId)
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Query meal plan, ensuring it belongs to the user
      const mealPlan = await db.query.mealPlans.findFirst({
        where: and(
          eq(mealPlans.id, planId),
          eq(mealPlans.userId, user.id)
        )
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      // Extract the meals from the planData
      const { planData, ...planMetadata } = mealPlan;
      
      return res.status(200).json({
        success: true,
        mealPlan: {
          ...planMetadata,
          timeFrame: planData.timeFrame,
          meals: planData.meals,
          nutritionSummary: planData.nutritionSummary
        }
      });
    } catch (error) {
      console.error('Error getting meal plan details:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to get meal plan details' });
    }
  }
};