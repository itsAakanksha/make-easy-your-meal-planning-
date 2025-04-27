import { Router } from 'express';
import { clerkWebhookController } from '../controllers/webhookController';

const router = Router();

// Webhook endpoint for Clerk
router.post('/clerk', clerkWebhookController.handleWebhook);

export default router;