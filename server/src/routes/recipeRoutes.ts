import { Router } from 'express';
import { requireAuth, resolveUserId, optionalAuth } from '../middlewares/auth.middleware';
import { recipeController } from '../controllers/recipeController';

// Create a router instance
const router = Router();

/**
 * Recipe routes
 * All routes here are prefixed with /api/recipes
 */

// Use optional auth to personalize results if user is logged in
router.use(optionalAuth);

// Standard recipe search via Spoonacular
router.get('/search', recipeController.searchRecipesSpoonacular);

// Semantic search using vector embeddings
router.get('/search/semantic', recipeController.searchRecipesSemantic);

// Get user's saved recipes - MUST be defined BEFORE the /:id route to avoid parameter conflicts
router.get('/saved', requireAuth, resolveUserId, 
  // Type assertion to fix TypeScript error
  (req, res) => (recipeController as any).getSavedRecipes(req, res)
);

// Save a recipe
router.post('/save', requireAuth, resolveUserId, 
  // Type assertion to fix TypeScript error
  (req, res) => (recipeController as any).saveRecipe(req, res)
);

// Unsave a recipe
router.post('/unsave', requireAuth, resolveUserId, 
  // Type assertion to fix TypeScript error
  (req, res) => (recipeController as any).unsaveRecipe(req, res)
);

// Check if a recipe is saved
router.get('/:id/saved', requireAuth, resolveUserId, 
  // Type assertion to fix TypeScript error
  (req, res) => (recipeController as any).isRecipeSaved(req, res)
);

// Get recipe details - MUST be defined AFTER more specific routes
router.get('/:id', recipeController.getRecipeById);

export default router;