import { Router } from 'express';
import userRoutes from './userRoutes';
import recipeRoutes from './recipeRoutes';
import mealPlanRoutes from './mealPlanRoutes';

/**
 * Main router file that aggregates all route modules
 * Each module is mounted under a specific path prefix
 */
const router = Router();

// API routes
router.use('/users', userRoutes);
router.use('/recipes', recipeRoutes);
router.use('/mealplans', mealPlanRoutes);

export default router;