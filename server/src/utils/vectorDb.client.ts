/**
 * Vector database client for semantic search functionality
 * This implementation uses PostgreSQL with pgvector extension
 */

import { Pool } from 'pg';
import { ApiError } from './error.classes';

// Initialize PostgreSQL connection pool
let pgPool: Pool | null = null;

// Gemini's embedding-001 model produces 768-dimensional vectors
const EMBEDDING_DIMENSION = 768;

/**
 * Ensure PostgreSQL client is initialized
 */
async function ensureClient(): Promise<Pool> {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new ApiError('PostgreSQL connection string missing', 500);
    }
    
    pgPool = new Pool({ connectionString });
    
    // Check if pgvector extension is installed
    try {
      const client = await pgPool.connect();
      try {
        // Create the extension if it doesn't exist
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        
        // First, check if the recipe_embeddings table exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'recipe_embeddings'
          );
        `);
        
        // If the table exists, we need to check if its schema is compatible with our embedding dimension
        if (tableExists.rows[0].exists) {
          try {
            // Try to drop the old indexes first to prevent conflicts
            await client.query(`DROP INDEX IF EXISTS recipe_embeddings_vector_idx;`);
            
            // Drop the old table to recreate it with the new dimension
            console.log(`Table recipe_embeddings exists. Dropping and recreating with dimension ${EMBEDDING_DIMENSION}...`);
            await client.query(`DROP TABLE recipe_embeddings;`);
          } catch (dropError) {
            console.error('Error dropping existing table:', dropError);
            // Continue anyway, as the table might not exist
          }
        }
        
        // Create the recipes table with vector support
        console.log(`Creating recipe_embeddings table with dimension ${EMBEDDING_DIMENSION}...`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS recipe_embeddings (
            id TEXT PRIMARY KEY,
            embedding vector(${EMBEDDING_DIMENSION}),
            metadata JSONB
          );
        `);
        
        // Create an index for efficient vector search
        console.log('Creating vector index...');
        await client.query(`
          CREATE INDEX IF NOT EXISTS recipe_embeddings_vector_idx 
          ON recipe_embeddings 
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100);
        `);
        
        console.log('Vector database setup complete!');
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error initializing pgvector:', error);
      throw new ApiError('Failed to initialize vector database', 500);
    }
  }
  
  return pgPool;
}

/**
 * Find similar vectors (recipes) to the query embedding
 */
export async function findSimilarVectors(
  queryEmbedding: number[],
  topK: number = 10
): Promise<Array<{ id: string; score: number }>> {
  try {
    const pool = await ensureClient();
    const client = await pool.connect();
    
    try {
      // Convert array to PostgreSQL vector format
      const vectorString = `[${queryEmbedding.join(',')}]`;
      
      // Query for similar vectors using cosine distance
      const result = await client.query(`
        SELECT 
          id, 
          1 - (embedding <=> $1::vector) as score,
          metadata
        FROM recipe_embeddings
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `, [vectorString, topK]);
      
      if (!result.rows || result.rows.length === 0) {
        return [];
      }
      
      // Transform response into a more usable format
      return result.rows.map(row => ({
        id: row.id,
        score: row.score,
        // Metadata is already a JavaScript object thanks to pg's type conversion
        // metadata: row.metadata
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error querying vector database:', error);
    
    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to search vector database', 500);
  }
}

/**
 * Store a recipe embedding in the vector database
 */
export async function storeEmbedding(
  id: string,
  embedding: number[],
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const pool = await ensureClient();
    const client = await pool.connect();
    
    try {
      // Convert array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;
      
      // Upsert the embedding
      await client.query(`
        INSERT INTO recipe_embeddings (id, embedding, metadata)
        VALUES ($1, $2::vector, $3)
        ON CONFLICT (id) 
        DO UPDATE SET
          embedding = $2::vector,
          metadata = $3
      `, [id, vectorString, metadata]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error storing embedding:', error);
    
    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to store embedding', 500);
  }
}

/**
 * Delete a recipe embedding from the vector database
 */
export async function deleteEmbedding(id: string): Promise<void> {
  try {
    const pool = await ensureClient();
    const client = await pool.connect();
    
    try {
      await client.query('DELETE FROM recipe_embeddings WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting embedding:', error);
    
    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to delete embedding', 500);
  }
}