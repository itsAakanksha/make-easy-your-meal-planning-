import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from './shared/schema';

dotenv.config();

// Parse database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Parse database URL manually to avoid URL parsing issues
function parseDatabaseUrl(url: string) {
  try {
    const dbUrl = new URL(url);
    return {
      user: dbUrl.username,
      password: dbUrl.password,
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || '5432', 10),
      database: dbUrl.pathname.split('/')[1],
      ssl: dbUrl.searchParams.get('sslmode') === 'require' ? true : false
    };
  } catch (error) {
    console.error('Error parsing database URL:', error);
    throw new Error('Invalid database URL format');
  }
}

async function setupDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Connect to the database
    // We can safely assert databaseUrl as string since we check for undefined above
    const dbConfig = parseDatabaseUrl(databaseUrl as string);
    const pool = new Pool({
      user: dbConfig.user,
      password: dbConfig.password,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      ssl: { rejectUnauthorized: false }
    });
    
    const db = drizzle(pool, { schema });
    
    // Run migrations from the drizzle/migrations folder
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('Migrations completed successfully!');
    
    // Close the connection
    await pool.end();
    
    console.log('Database setup completed.');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the function
setupDatabase();