/**
 * Embedding generator for text-to-vector encoding
 * This enables semantic search capabilities across recipes
 */

import axios from 'axios';
import { ApiError } from './error.classes';

/**
 * Generate text embeddings using OpenAI's embedding API
 * This converts text into vector representations for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Make sure OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ApiError('OpenAI API key not configured', 500);
    }

    // Call OpenAI API to generate embedding
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: 'text-embedding-ada-002' // Recommended model for embeddings
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the embedding vector from the response
    if (response.data && 
        response.data.data && 
        response.data.data[0] && 
        response.data.data[0].embedding) {
      return response.data.data[0].embedding;
    }

    throw new ApiError('Invalid response from OpenAI', 500);
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    if (axios.isAxiosError(error)) {
      // Handle API-specific errors
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || 'Failed to generate embedding';
      throw new ApiError(message, status);
    }
    
    // Re-throw existing ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle other errors
    throw new ApiError('Failed to generate embedding', 500);
  }
}