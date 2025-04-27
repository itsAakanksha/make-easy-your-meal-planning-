/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, any>;
  code?: string;

  constructor(
    message: string, 
    statusCode = 500, 
    errors?: Record<string, any>, 
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }
}

/**
 * Not Found API error, status code 404
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized API error, status code 401
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized: Authentication required') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden API error, status code 403
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden: You do not have permission to access this resource') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Bad Request API error, status code 400
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request: Invalid parameters', errors?: Record<string, any>) {
    super(message, 400, errors);
    this.name = 'BadRequestError';
  }
}