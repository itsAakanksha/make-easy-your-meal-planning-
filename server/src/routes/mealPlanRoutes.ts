import { Router } from 'express';
import { mealPlanController } from '../controllers/mealPlanController';
import { requireAuth, resolveUserId } from '../middlewares/auth.middleware';

const router = Router();

// All meal plan routes require authentication
router.use(requireAuth);
// Add resolveUserId middleware to all meal plan routes
router.use(resolveUserId);

// Generate a meal plan
router.post('/generate', mealPlanController.generateMealPlan);

// Add a recipe to a meal plan
router.post('/:id/add-recipe', mealPlanController.addRecipeToMealPlan);

// Get all meal plans for the current user
router.get('/', mealPlanController.getUserMealPlans);

// Get meal plans for a specific date
router.get('/date/:date', mealPlanController.getMealPlansByDate);

// Get specific meal plan by ID
router.get('/:id', mealPlanController.getMealPlanById);

// Remove a meal from a meal plan
router.delete('/meals/:id', mealPlanController.removeMeal);

// Validate a meal plan's data integrity
router.get('/:id/validate', mealPlanController.validateMealPlan);

export default router;