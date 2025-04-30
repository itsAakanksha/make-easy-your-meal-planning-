/**
 * Embedding generator for text-to-vector encoding
 * This enables semantic search capabilities across recipes
 */

import axios from 'axios';
import { ApiError } from './error.classes';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Generate text embeddings using Google's Gemini API
 * This converts text into vector representations for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Make sure Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ApiError('Gemini API key not configured', 500);
    }

    // Initialize the Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    // Generate embedding using Gemini's embedding model
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length === 0) {
      throw new ApiError('Invalid response from Gemini API', 500);
    }

    return embedding;
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