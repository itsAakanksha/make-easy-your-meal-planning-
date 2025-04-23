import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { storage } from '../../storage';

// Define a custom interface to extend Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        internalUserId?: number;
      };
    }
  }
}

// Middleware to require authentication using Clerk
export const requireAuth = ClerkExpressRequireAuth({
  // Optional configuration
  onError: (err) => {
    console.error('Authentication error:', err);
    return new Error('Authentication required');
  },
});

// Middleware to resolve the Clerk user ID to our internal user ID
export const resolveUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the request has auth information
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clerkUserId = req.auth.userId;

    // Find the internal user ID based on the Clerk ID
    const user = await storage.getUserByClerkId(clerkUserId);

    if (user) {
      // Add the internal user ID to the request auth object
      req.auth.internalUserId = user.id;
    }

    next();
  } catch (error) {
    console.error('Error resolving user ID:', error);
    res.status(500).json({ error: 'Server error while resolving user ID' });
  }
};