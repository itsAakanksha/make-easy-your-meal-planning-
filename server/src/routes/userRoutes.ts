import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth, resolveUserId } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(requireAuth);
// Add resolveUserId middleware to all user routes
router.use(resolveUserId);

// Get user profile with preferences
router.get('/me/profile', userController.getUserProfile);

// User preferences endpoints
router.get('/preferences', userController.getUserPreferences); 
router.put('/preferences', userController.updateUserPreferences);

// Data validation endpoint
router.get('/me/validate', userController.validateUser);

export default router;