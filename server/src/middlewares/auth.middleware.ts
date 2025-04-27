import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../utils/error.classes';


// Define a unified interface for Request auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId?: string;
        internalUserId?: number;
        // Add email field to auth object 
        email?: string;
      };
    }
  }
}

/**
 * Middleware that requires authentication using Clerk
 * Will reject requests without valid authentication
 */
export const requireAuth = ClerkExpressRequireAuth({
  // Customize error response
  onError: (error: any) => {
    console.error('Auth error:', error);
    // More informative error message
    const statusCode = error.statusCode || 401;
    let message = 'Unauthorized: Authentication required';
    
    // Provide more detail for specific Clerk errors
    if (error.clerkError) {
      if (error.code === 'resource_not_found') {
        message = 'Account not found. Please sign up.';
      } else if (error.code === 'network_error') {
        message = 'Network error. Please try again.';
      } else if (error.code === 'form_identifier_not_found') {
        message = 'Account not found with that identifier. Please check and try again.';
      }
    }
    
    return {
      status: statusCode,
      message
    };
  }
});

/**
 * Middleware that checks for authentication but doesn't require it
 * Populates req.auth if authenticated, otherwise continues
 */
export const optionalAuth = ClerkExpressWithAuth({
  // Let the request continue even if not authenticated
  // No additional options for compatibility
});

/**
 * Middleware to resolve the Clerk user ID to our internal user ID
 * This uses direct database access instead of a storage service
 */
export const resolveUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    const clerkUserId = req.auth.userId;
    
    // Find the internal user ID based on the Clerk ID using Drizzle ORM
    const userResult = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (userResult.length > 0) {
      // Add the internal user ID to the request auth object
      req.auth.internalUserId = userResult[0].id;
    } else {
      // User exists in authentication system but not in our database
      // This could happen in legitimate cases, so try to auto-provision
      try {
        // Get user email from Clerk or use a placeholder
        const email = req.auth.email || `${clerkUserId}@example.com`;
        
        // Attempt to create the user in our database
        const [newUser] = await db.insert(users)
          .values({
            clerkUserId,
            email, // Add the required email field
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: users.id });
          
        if (newUser?.id) {
          req.auth.internalUserId = newUser.id;
          next();
          return;
        }
      } catch (provisionError) {
        console.error('Failed to auto-provision user:', provisionError);
      }
      
      return next(new ApiError('User not found in system', 404));
    }
    
    next();
  } catch (error) {
    console.error('Error resolving user ID:', error);
    next(error);
  }
};