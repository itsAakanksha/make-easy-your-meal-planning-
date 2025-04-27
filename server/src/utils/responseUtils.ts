/**
 * Helper functions for working with HTTP responses
 */

/**
 * Standard success response formatter
 * Creates a consistent response format for successful API calls
 */
export const successResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    message: message || 'Operation completed successfully',
    data
  };
};

/**
 * Standard error response formatter
 * Creates a consistent response format for failed API calls
 */
export const errorResponse = (message: string, statusCode: number = 500, errors?: any) => {
  return {
    success: false,
    message,
    statusCode,
    errors
  };
};

/**
 * Type guard to determine if an error is a standard Error object
 */
export const isError = (error: any): error is Error => {
  return error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error);
};

/**
 * Format API errors for consistent error handling
 */
export const formatApiError = (error: any): { message: string; statusCode: number } => {
  if (isError(error)) {
    const statusCode = 'status' in error ? (error as any).status : 500;
    return {
      message: error.message || 'An unexpected error occurred',
      statusCode
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  };
};