import { Request, Response } from 'express';
import { ApiError } from '../utils/error.classes';
import { db } from '../db';
import { users, userPreferences, mealPlans } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { selectMeals } from '../utils/mealPlanningAlgorithm';
import { searchRecipes, RecipeSearchParams } from '../utils/spoonacular.client';
import { validateMealPlan } from '../utils/dataValidation';

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
  useUserPreferences: z.boolean().default(true),
  // Add date parameter to the schema to allow specifying the plan date
  date: z.string().optional()
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

      const { timeFrame, targetCalories, diet, exclude, preferences, useUserPreferences, date } = validationResult.data;

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
      // If date parameter is provided, use it as the start date
      const startDate = date ? new Date(date) : new Date();
      // Set to midnight on the selected date to avoid timezone issues
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
        // Request significantly more recipes for better variety and quality
        number: timeFrame === 'day' 
          ? effectiveMealCount * 20  // 20x more recipes than meals for daily plans
          : effectiveMealCount * 7 * 10  // 10x more recipes per meal for weekly plans (could be 210+ recipes)
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

      console.log(`📝 MealPlanController: Attempting to insert meal plan for user ${user.id}`);
      const insertedPlan = await db.insert(mealPlans)
      .values({
        userId: user.id,
        startDate: startDate.toISOString().split('T')[0], // Add this line
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
      

      // Validate the meal plan was saved correctly
      const mealPlanId = insertedPlan[0].id;
      const validationSucceeded = await validateMealPlan(mealPlanId, user.id);
      
      if (!validationSucceeded) {
        console.warn(`Warning: Meal plan ${mealPlanId} validation failed`);
      }

      return res.status(201).json({
        success: true,
        id: mealPlanId,
        validated: validationSucceeded,
        mealPlan: {
          id: mealPlanId,
          timeFrame,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          meals: formattedMeals,
          nutritionSummary
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

      // Validate meal plan
      const validationSucceeded = await validateMealPlan(planId, user.id);
      if (!validationSucceeded) {
        console.warn(`Warning: Retrieved meal plan ${planId} failed validation checks`);
      }

      // Extract the meals from the planData
      const { planData, ...planMetadata } = mealPlan;
      
      return res.status(200).json({
        success: true,
        validated: validationSucceeded,
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
  },

  /**
   * Validate a meal plan's data integrity
   */
  validateMealPlan: async (req: Request, res: Response) => {
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

      // Validate the meal plan
      const validationSucceeded = await validateMealPlan(planId, user.id);
      
      return res.status(200).json({
        success: true,
        mealPlanId: planId,
        validated: validationSucceeded
      });
    } catch (error) {
      console.error('Error validating meal plan:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to validate meal plan' });
    }
  },

  /**
   * Get meal plans for a specific date
   * This endpoint retrieves meal plans that cover the given date
   */
  getMealPlansByDate: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ApiError('Invalid date format. Please use YYYY-MM-DD format', 400);
      }

      // Parse the requested date
      const requestedDate = new Date(date);
      if (isNaN(requestedDate.getTime())) {
        throw new ApiError('Invalid date', 400);
      }
      
      // Format date as YYYY-MM-DD for database query
      const formattedDate = requestedDate.toISOString().split('T')[0];

      // Find internal user ID
      const user = await db.query.users.findFirst({
        columns: { id: true },
        where: eq(users.clerkUserId, clerkUserId)
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Query meal plans that include the requested date
      // A plan includes the date if: startDate <= requestedDate <= endDate
      const matchingPlans = await db.query.mealPlans.findMany({
        where: and(
          eq(mealPlans.userId, user.id),
          sql`${mealPlans.startDate} <= ${formattedDate}`,
          sql`${mealPlans.endDate} >= ${formattedDate}`
        ),
        orderBy: desc(mealPlans.createdAt)
      });

      if (!matchingPlans || matchingPlans.length === 0) {
        return res.status(200).json({
          success: true,
          mealPlans: []
        });
      }

      // Process the plans to include only meals for the requested date
      const processedPlans = matchingPlans.map(plan => {
        const { planData, ...planMetadata } = plan;
        
        // Filter meals to only include those for the requested date
        const mealsForRequestedDate = planData.meals.filter(meal => {
          // Some meal plans might have date as a string, others as a Date object
          const mealDate = new Date(meal.date);
          return mealDate.toISOString().split('T')[0] === formattedDate;
        });

        return {
          ...planMetadata,
          timeFrame: planData.timeFrame,
          meals: mealsForRequestedDate, // Use consistent property name for meals
          mealsForRequestedDate: mealsForRequestedDate, // Keep this for backward compatibility
          totalMeals: planData.meals.length,
          nutritionSummary: planData.nutritionSummary
        };
      });

      return res.status(200).json({
        success: true,
        date: formattedDate,
        mealPlans: processedPlans
      });
    } catch (error) {
      console.error('Error getting meal plans for date:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to get meal plans for date' });
    }
  },

  /**
   * Remove a meal from a meal plan
   * This endpoint allows the user to remove a specific meal from their meal plan
   */
  removeMeal: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      const { id } = req.params;
      const mealId = id; // This is the composite ID from the meals array: recipeId_index
      
      if (!mealId) {
        throw new ApiError('Invalid meal ID', 400);
      }

      // Find internal user ID
      const user = await db.query.users.findFirst({
        columns: { id: true },
        where: eq(users.clerkUserId, clerkUserId)
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Find all user's meal plans
      const userMealPlans = await db.query.mealPlans.findMany({
        where: eq(mealPlans.userId, user.id)
      });

      // Search through each meal plan's meals to find and remove the specified meal
      let mealFound = false;
      let updatedPlanId = 0;

      for (const plan of userMealPlans) {
        const planData = plan.planData;
        const meals = planData.meals || [];

        // Find the meal index
        const mealIndex = meals.findIndex(meal => meal.id === mealId);
        
        if (mealIndex !== -1) {
          // Remove the meal
          meals.splice(mealIndex, 1);
          mealFound = true;

          // Update meal plan in database
          await db.update(mealPlans)
            .set({ 
              planData: { 
                ...planData, 
                meals 
              },
              updatedAt: new Date()
            })
            .where(eq(mealPlans.id, plan.id));
          
          updatedPlanId = plan.id;
          break;
        }
      }

      if (!mealFound) {
        throw new ApiError('Meal not found in any meal plan', 404);
      }

      return res.status(200).json({
        success: true,
        message: 'Meal removed successfully',
        updatedPlanId
      });
    } catch (error) {
      console.error('Error removing meal:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to remove meal' });
    }
  },

  /**
   * Add a recipe to a meal plan
   * This endpoint allows users to add a specific recipe to their meal plan for a specific meal type
   */
  addRecipeToMealPlan: async (req: Request, res: Response) => {
    try {
      // Get clerkUserId from the auth middleware
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        throw new ApiError('Unauthorized', 401);
      }

      const { id } = req.params; // Meal plan ID
      const planId = parseInt(id);
      
      if (isNaN(planId)) {
        throw new ApiError('Invalid meal plan ID', 400);
      }

      // Validate request body
      const { recipeId, mealType, date } = req.body;
      
      if (!recipeId || !mealType) {
        throw new ApiError('Recipe ID and meal type are required', 400);
      }

      // Find internal user ID
      const user = await db.query.users.findFirst({
        columns: { id: true },
        where: eq(users.clerkUserId, clerkUserId)
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Get the meal plan, ensuring it belongs to the user
      const mealPlan = await db.query.mealPlans.findFirst({
        where: and(
          eq(mealPlans.id, planId),
          eq(mealPlans.userId, user.id)
        )
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      // Get recipe details from Spoonacular API
      const recipeDetails = await searchRecipes({
        ids: [recipeId],
        number: 1
      });

      if (!recipeDetails || recipeDetails.length === 0) {
        throw new ApiError('Recipe not found', 404);
      }

      const recipe = recipeDetails[0];

      // Format the new meal
      const newMeal = {
        id: `${recipe.id}_${Date.now()}`, // Generate a unique ID
        recipeId: recipe.id,
        mealType: mealType.toLowerCase(),
        title: recipe.title,
        imageUrl: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        date: date || mealPlan.startDate // Use provided date or default to plan start date
      };

      // Update the plan's meals array
      const planData = mealPlan.planData;
      const meals = planData.meals || [];

      // Check if we already have a meal of this type for this date
      const mealDate = new Date(newMeal.date).toISOString().split('T')[0];
      const existingMealIndex = meals.findIndex(meal => {
        const currentMealDate = new Date(meal.date).toISOString().split('T')[0];
        return meal.mealType === newMeal.mealType && currentMealDate === mealDate;
      });

      // Either replace existing meal or add new one
      if (existingMealIndex !== -1) {
        meals[existingMealIndex] = newMeal;
      } else {
        meals.push(newMeal);
      }

      // Update the meal plan in the database
      await db.update(mealPlans)
        .set({ 
          planData: { 
            ...planData, 
            meals 
          },
          updatedAt: new Date()
        })
        .where(eq(mealPlans.id, planId));

      return res.status(200).json({
        success: true,
        message: 'Recipe added to meal plan',
        meal: newMeal
      });
    } catch (error) {
      console.error('Error adding recipe to meal plan:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to add recipe to meal plan' });
    }
  },
};