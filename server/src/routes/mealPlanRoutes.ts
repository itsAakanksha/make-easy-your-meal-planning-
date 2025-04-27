import { Router } from 'express';
import { mealPlanController } from '../controllers/mealPlanController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All meal plan routes require authentication
router.use(requireAuth);

// Generate a meal plan
router.post('/generate', mealPlanController.generateMealPlan);

// Get all meal plans for the current user
router.get('/', mealPlanController.getUserMealPlans);

// Get specific meal plan by ID
router.get('/:id', mealPlanController.getMealPlanById);

export default router;