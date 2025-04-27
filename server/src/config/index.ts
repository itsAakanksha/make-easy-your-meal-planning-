import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration
 * Centralizes all configuration variables
 */
const config = {
  // Server settings
  server: {
    port: process.env.PORT || 8000,
    environment: process.env.NODE_ENV || 'development',
  },
  
  // Authentication settings
  auth: {
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
  },
  
  // API services
  api: {
    spoonacularApiKey: process.env.SPOONACULAR_API_KEY,
    spoonacularBaseUrl: 'https://api.spoonacular.com',
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  
  // Client app settings
  client: {
    baseUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  
  // Database settings
  database: {
    url: process.env.DATABASE_URL,
  }
};

export default config;