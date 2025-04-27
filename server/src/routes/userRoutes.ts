import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// Get user profile with preferences
router.get('/me/profile', userController.getUserProfile);

// User preferences endpoints
router.put('/me/preferences', userController.updateUserPreferences);

export default router;