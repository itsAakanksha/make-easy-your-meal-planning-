import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import dotenv from "dotenv";
import { requireAuth, resolveUserId } from "./middleware/auth";
import { generateMealPlan } from "./services/gemini";
import { RecipeService } from "./services/recipe";

dotenv.config();

// Default images for different meal types
const DEFAULT_MEAL_IMAGES: Record<string, string> = {
  breakfast: 'https://spoonacular.com/recipeImages/715567-556x370.jpg', // Pancakes image
  lunch: 'https://spoonacular.com/recipeImages/715421-556x370.jpg',     // Avocado toast image
  dinner: 'https://spoonacular.com/recipeImages/716429-556x370.jpg',    // Spaghetti image
  snack: 'https://spoonacular.com/recipeImages/715397-556x370.jpg',     // Smoothie bowl image
  default: 'https://placehold.co/600x400/orange/white?text=Delicious+Recipe'
};

// Create a new recipe service instance
const recipeService = new RecipeService();

// Default fallback image URL for when a recipe doesn't have an image
const DEFAULT_RECIPE_IMAGE = 'https://placehold.co/600x400/orange/white?text=Delicious+Recipe';

// Helper function to normalize recipe IDs
function normalizeRecipeId(id: string): string {
  const match = id.match(/spoonacular_(\d+)/);
  return match ? match[1] : id;
}

// Helper function to get an appropriate image for a meal type
function getMealTypeImage(mealType: string): string {
  const type = mealType.toLowerCase();
  return DEFAULT_MEAL_IMAGES[type] || DEFAULT_MEAL_IMAGES.default;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  // Protected routes that require authentication
  
  // User profile endpoints
  app.get("/api/user/profile", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get or create the internal user based on Clerk ID
      let user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        // Create a new user record
        user = await storage.createUser(clerkUserId);
      }

      // Get the user profile if it exists
      const profile = await storage.getUserProfile(user.id);
      
      res.json({
        success: true,
        userId: user.id,
        profile: profile || null
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/user/profile", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get or create the internal user based on Clerk ID
      let user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        // Create a new user record
        user = await storage.createUser(clerkUserId);
      }

      // Update user profile with the request body
      const updatedProfile = await storage.updateUserProfile(user.id, req.body);
      
      res.json({
        success: true,
        profile: updatedProfile
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Recipe search endpoint
  app.post("/api/recipes/search", requireAuth, async (req, res) => {
    try {
      const searchParams = req.body;
      console.log("Recipe search request:", searchParams);

      const recipes = await recipeService.searchRecipes(searchParams);

      res.json({
        success: true,
        recipes
      });
    } catch (error: any) {
      console.error("Recipe search error:", error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Get user's saved recipes - MUST be defined BEFORE the /:id route
  app.get("/api/recipes/saved", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the user's saved recipes
      const recipes = await storage.getSavedRecipes(user.id);
      
      res.json({
        success: true,
        recipes
      });
    } catch (error: any) {
      console.error("Error fetching saved recipes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save recipe endpoint
  app.post("/api/recipes/save", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { recipeId } = req.body;
      if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Convert recipeId to number if it's a string
      const recipeIdNum = typeof recipeId === 'string' ? parseInt(recipeId, 10) : recipeId;

      // Save the recipe
      const success = await storage.saveRecipe(user.id, recipeIdNum);
      
      if (success) {
        res.json({
          success: true,
          message: "Recipe saved successfully"
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: "Failed to save recipe" 
        });
      }
    } catch (error: any) {
      console.error("Error saving recipe:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Unsave recipe endpoint
  app.post("/api/recipes/unsave", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { recipeId } = req.body;
      if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Convert recipeId to number if it's a string
      const recipeIdNum = typeof recipeId === 'string' ? parseInt(recipeId, 10) : recipeId;

      // Unsave the recipe
      const success = await storage.unsaveRecipe(user.id, recipeIdNum);
      
      if (success) {
        res.json({
          success: true,
          message: "Recipe unsaved successfully"
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: "Failed to unsave recipe" 
        });
      }
    } catch (error: any) {
      console.error("Error unsaving recipe:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check if recipe is saved endpoint
  app.get("/api/recipes/:id/saved", requireAuth, resolveUserId, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id, 10);
      const clerkUserId = req.auth?.userId;
      
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if the recipe is saved
      const isSaved = await storage.isRecipeSaved(user.id, recipeId);
      
      res.json({
        success: true,
        isSaved
      });
    } catch (error: any) {
      console.error("Error checking if recipe is saved:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get recipe details endpoint - MUST be defined AFTER more specific routes
  app.get("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id, 10);
      
      // Check if recipe ID is valid
      if (isNaN(recipeId)) {
        console.warn("Invalid recipe ID received:", req.params.id);
        // Create a custom recipe placeholder
        const customRecipe = {
          id: 999999,
          title: "Custom Recipe",
          image: 'https://placehold.co/600x400/orange/white?text=Custom+Recipe',
          readyInMinutes: 30,
          servings: 4,
          instructions: 'This is a custom recipe that you can customize with your own details.',
          nutrition: { nutrients: [
            { name: 'Calories', amount: 300, unit: 'kcal' },
            { name: 'Protein', amount: 15, unit: 'g' },
            { name: 'Fat', amount: 10, unit: 'g' },
            { name: 'Carbohydrates', amount: 40, unit: 'g' }
          ]},
          extendedIngredients: [
            { id: 1, name: 'Ingredient 1', amount: 1, unit: 'cup', aisle: 'Custom' },
            { id: 2, name: 'Ingredient 2', amount: 2, unit: 'tbsp', aisle: 'Custom' }
          ],
          sourceName: 'Custom Recipe',
          diets: ['custom']
        };
        
        return res.json({
          success: true,
          recipe: customRecipe
        });
      }
      
      const recipe = await recipeService.getRecipeById(recipeId);
      
      res.json({
        success: true,
        recipe
      });
    } catch (error: any) {
      console.error(`Recipe fetch error for ID ${req.params.id}:`, error);
      
      // For errors, return fallback recipe data
      const fallbackRecipe = {
        id: parseInt(req.params.id) || 999999,
        title: "Recipe currently unavailable",
        image: "https://placehold.co/600x400/gray/white?text=Recipe+Unavailable",
        readyInMinutes: 0,
        servings: 0,
        instructions: "We're having trouble retrieving this recipe right now. Please try again later.",
        nutrition: { nutrients: [] },
        extendedIngredients: []
      };
      
      return res.json({
        success: true,
        recipe: fallbackRecipe
      });
    }
  });

  // Meal plan endpoints
  app.post("/api/meal-plan/generate", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user preferences
      const profile = await storage.getUserProfile(user.id);
      
      // Generate meal plan using Gemini AI
      const { date, days = 1 } = req.body;
      
      // Combine stored preferences with any overrides from the request
      const preferences = {
        diet: profile?.diet,
        allergies: profile?.allergies,
        dislikes: profile?.dislikes,
        cuisinePreferences: profile?.cuisinePreferences,
        goalType: profile?.goalType,
        calorieTarget: profile?.calorieTarget,
        proteinTarget: profile?.proteinTarget,
        carbTarget: profile?.carbTarget,
        fatTarget: profile?.fatTarget,
        mealCount: profile?.mealCount || 3,
        budgetPerMeal: profile?.budgetPerMeal,
        cookingTime: profile?.cookingTime,
        servings: profile?.servings || 1,
        days,
        ...req.body.preferences // Override with any preferences sent in the request
      };
      
      console.log("Generating meal plan:", { date, preferences });
      
      // Call Gemini to generate meal plan
      const generatedPlan = await generateMealPlan(preferences);
      
      // Store meal plan in database
      const mealPlans = [];
      
      for (const dayPlan of generatedPlan) {
        // Create meal plan record
        const mealPlan = await storage.createMealPlan({
          userId: user.id,
          date: dayPlan.date,
          name: `Meal Plan for ${dayPlan.date}`,
          description: `Generated meal plan based on your preferences`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Create individual meal records
        const meals = [];
        for (const mealData of dayPlan.meals) {
          // Fetch recipe details to get image and timing info
          let recipeDetails;
          try {
            recipeDetails = await recipeService.getRecipeById(mealData.recipeId);
          } catch (error) {
            console.error(`Failed to fetch recipe details for ${mealData.recipeId}:`, error);
            recipeDetails = null;
          }
          
          const meal = await storage.createMeal({
            mealPlanId: mealPlan.id,
            recipeId: mealData.recipeId,
            mealType: mealData.mealType,
            title: mealData.title,
            imageUrl: recipeDetails?.image || getMealTypeImage(mealData.mealType), // Use fallback image if needed
            readyInMinutes: recipeDetails?.readyInMinutes || 30, // Default to 30 minutes if not available
            servings: preferences.servings || 1,
            createdAt: new Date()
          });
          
          meals.push(meal);
        }
        
        mealPlans.push({
          ...mealPlan,
          meals
        });
      }
      
      res.json({
        success: true,
        mealPlans
      });
    } catch (error: any) {
      console.error("Meal plan generation error:", error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Get user's meal plans
  app.get("/api/meal-plans", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the user's meal plans
      const mealPlans = await storage.getMealPlansByUserId(user.id);
      
      // For each meal plan, get the associated meals
      const result = await Promise.all(mealPlans.map(async (plan) => {
        const meals = await storage.getMealsByPlanId(plan.id);
        return {
          ...plan,
          meals
        };
      }));
      
      res.json({
        success: true,
        mealPlans: result
      });
    } catch (error: any) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific meal plan
  app.get("/api/meal-plans/:id", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the meal plan
      const mealPlan = await storage.getMealPlan(parseInt(req.params.id));
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      // Verify the meal plan belongs to the user
      if (mealPlan.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get the meals for this plan
      const meals = await storage.getMealsByPlanId(mealPlan.id);
      
      res.json({
        success: true,
        mealPlan: {
          ...mealPlan,
          meals
        }
      });
    } catch (error: any) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate shopping list from a meal plan
  app.get("/api/meal-plans/:id/shopping-list", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the meal plan
      const mealPlanId = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(mealPlanId);
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      // Verify the meal plan belongs to the user
      if (mealPlan.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if shopping list already exists for this meal plan
      const existingItems = await storage.getShoppingList(user.id, mealPlanId);
      
      if (existingItems.length > 0) {
        // Return existing shopping list
        return res.json({
          success: true,
          shoppingList: existingItems
        });
      }
      
      // Get the meals for this plan
      const meals = await storage.getMealsByPlanId(mealPlanId);
      
      // Extract recipe IDs
      const recipeIds = meals.map(meal => meal.recipeId);
      
      // Generate shopping list using Recipe Service
      const ingredients = await recipeService.generateShoppingList(recipeIds);
      
      // Store shopping list items
      const shoppingList = await Promise.all(
        ingredients.map(ingredient => 
          storage.createShoppingListItem({
            userId: user.id,
            mealPlanId,
            name: ingredient.name,
            amount: ingredient.amount?.toString(),
            unit: ingredient.unit,
            category: ingredient.category,
            checked: false,
            createdAt: new Date()
          })
        )
      );
      
      res.json({
        success: true,
        shoppingList
      });
    } catch (error: any) {
      console.error("Shopping list generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update shopping list item
  app.patch("/api/shopping-list/:id", requireAuth, resolveUserId, async (req, res) => {
    try {
      const clerkUserId = req.auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get internal user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const itemId = parseInt(req.params.id);
      const { checked } = req.body;
      
      // Update the shopping list item
      const updatedItem = await storage.updateShoppingListItem(itemId, checked);
      
      res.json({
        success: true,
        item: updatedItem
      });
    } catch (error: any) {
      console.error("Error updating shopping list item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}