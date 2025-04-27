import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '../utils/error.classes';

/**
 * Creates middleware to validate request body against a Zod schema
 * @param schema The Zod schema to validate against
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and parse the request body against the schema
      const validatedData = schema.parse(req.body);

      // Replace the request body with the validated/parsed data
      req.body = validatedData;

      // Continue to the next middleware/controller
      next();
    } catch (error) {
      // If validation fails, create a 400 error with validation details
      next(new ApiError(
        'Invalid request body', 
        400, 
        error instanceof z.ZodError ? { zodErrors: error.errors } : undefined
      ));
    }
  };
}

/**
 * Creates middleware to validate request query parameters against a Zod schema
 * @param schema The Zod schema to validate against
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and parse the query parameters against the schema
      const validatedData = schema.parse(req.query);

      // Replace the query params with the validated/parsed data
      req.query = validatedData as any;

      // Continue to the next middleware/controller
      next();
    } catch (error) {
      // If validation fails, create a 400 error with validation details
      next(new ApiError(
        'Invalid query parameters', 
        400, 
        error instanceof z.ZodError ? { zodErrors: error.errors } : undefined
      ));
    }
  };
}

/**
 * Creates middleware to validate request params against a Zod schema
 * @param schema The Zod schema to validate against
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and parse the URL parameters against the schema
      const validatedData = schema.parse(req.params);

      // Replace the params with the validated/parsed data
      req.params = validatedData as any;

      // Continue to the next middleware/controller
      next();
    } catch (error) {
      // If validation fails, create a 400 error with validation details
      next(new ApiError(
        'Invalid URL parameters', 
        400, 
        error instanceof z.ZodError ? { zodErrors: error.errors } : undefined
      ));
    }
  };
}