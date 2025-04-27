// Refreshes the database connection for Drizzle Studio
import { testConnection, db } from '../src/db';
import * as schema from '../src/db/schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

// Path to the migrations folder
const migrationsFolder = path.join(__dirname, '../drizzle/migrations');

async function refreshDatabase() {
  console.log('Testing database connection...');
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  console.log('Connection successful, running migrations...');
  
  try {
    // Run migrations
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
    
    // Check a table to confirm schema is correct
    const usersResult = await db.query.users.findMany({
      limit: 1
    });
    console.log('Database schema validated');
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('Error refreshing database:', error);
    process.exit(1);
  }
}

refreshDatabase();