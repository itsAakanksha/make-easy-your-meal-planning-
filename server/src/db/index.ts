import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; // Import all schemas
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Uncomment the next line if your hosting provider requires SSL
    // ssl: { rejectUnauthorized: false }
});

// Create and export the Drizzle client instance
export const db = drizzle(pool, { schema });

// Export the pool for direct SQL queries if needed
export { pool };

// Simple connection test function
export async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection successful:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}