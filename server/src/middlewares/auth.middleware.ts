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
      console.log('🔒 Auth Middleware: No userId found in request');
      return next(new ApiError('User not authenticated', 401));
    }

    const clerkUserId = req.auth.userId;
    console.log(`🔍 Auth Middleware: Resolving user ID for Clerk user: ${clerkUserId}`);
    
    // Find the internal user ID based on the Clerk ID using Drizzle ORM
    const userResult = await db.select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (userResult.length > 0) {
      // Add the internal user ID to the request auth object
      req.auth.internalUserId = userResult[0].id;
      req.auth.email = userResult[0].email;
      console.log(`✅ Auth Middleware: Found existing user with internal ID: ${userResult[0].id}, email: ${userResult[0].email}`);
      next();
      return;
    } else {
      // User exists in authentication system but not in our database
      // This could happen in legitimate cases, so try to auto-provision
      try {
        // Import clerk SDK to get user details
        const { users: clerkUsers } = require('@clerk/clerk-sdk-node');
        
        console.log(`🆕 Auth Middleware: User not found in database, attempting to provision: ${clerkUserId}`);
        
        // Get user details from Clerk
        console.log(`📡 Auth Middleware: Fetching user details from Clerk for ${clerkUserId}`);
        const clerkUser = await clerkUsers.getUser(clerkUserId);
        console.log(`📋 Auth Middleware: Received Clerk user details: ${JSON.stringify({
          id: clerkUser.id,
          emailCount: clerkUser.emailAddresses?.length || 0,
          primaryEmailId: clerkUser.primaryEmailAddressId
        })}`);
        
        // Get primary email address
        let email = null;
        if (clerkUser && clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          const primaryEmail = clerkUser.emailAddresses.find((e: { id: string }) => e.id === clerkUser.primaryEmailAddressId);
          email = primaryEmail ? primaryEmail.emailAddress : clerkUser.emailAddresses[0].emailAddress;
          console.log(`📧 Auth Middleware: Found email for user: ${email}`);
        }
        
        // Fallback if no email found
        if (!email) {
          email = `user_${clerkUserId}@example.com`;
          console.warn(`⚠️ Auth Middleware: No email found for Clerk user ${clerkUserId}, using placeholder: ${email}`);
        }
        
        console.log(`🔄 Auth Middleware: Provisioning new user with Clerk ID: ${clerkUserId} and email: ${email}`);
        
        // Use a transaction to ensure all related records are created
        console.log(`🔄 Auth Middleware: Starting database transaction to create user records`);
        const newUser = await db.transaction(async (tx) => {
          // Create user record
          console.log(`📝 Auth Middleware: Creating user record for ${clerkUserId}`);
          const [createdUser] = await tx.insert(users)
            .values({
              clerkUserId,
              email,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning({ id: users.id, email: users.email });
          
          if (!createdUser) {
            console.error(`❌ Auth Middleware: Failed to create user record in database for ${clerkUserId}`);
            throw new Error('Failed to create user record in database');
          }
          
          console.log(`✅ Auth Middleware: User record created with ID: ${createdUser.id}`);
          
          // Create user profile
          console.log(`📝 Auth Middleware: Creating user profile for internal user ID: ${createdUser.id}`);
          const { userProfiles } = await import('../db/schema');
          await tx.insert(userProfiles)
            .values({
              userId: createdUser.id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          
          // Create user preferences with defaults
          console.log(`📝 Auth Middleware: Creating user preferences for internal user ID: ${createdUser.id}`);
          const { userPreferences } = await import('../db/schema');
          await tx.insert(userPreferences)
            .values({
              userId: createdUser.id,
              diet: null,
              allergies: [],
              dislikes: [],
              cuisinePreferences: [],
              goals: {
                targetCalories: 2000,
                targetProtein: 100,
                targetCarbs: 250,
                targetFat: 70
              },
              mealCount: 3,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          
          return createdUser;
        });
        
        // Add to auth object
        req.auth.internalUserId = newUser.id;
        req.auth.email = newUser.email;
        
        console.log(`🎉 Auth Middleware: Successfully created user ${clerkUserId} with internal ID ${newUser.id}`);
        next();
        return;
      } catch (provisionError: unknown) {
        console.error(`❌ Auth Middleware: Failed to auto-provision user:`, provisionError);
        const errorMessage = provisionError instanceof Error 
          ? provisionError.message 
          : 'Unknown error during user provisioning';
        return next(new ApiError(`Failed to provision user account: ${errorMessage}`, 500));
      }
    }
  } catch (error) {
    console.error(`❌ Auth Middleware: Error resolving user ID:`, error);
    next(error);
  }
};