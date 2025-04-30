import { pool, db } from '../src/db';
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // 1. Connect to the database
    const client = await pool.connect();
    
    try {
      // 2. Drop the public schema (removes all tables)
      console.log('🗑️ Dropping the public schema...');
      await client.query('DROP SCHEMA public CASCADE');
      await client.query('CREATE SCHEMA public');
      await client.query('GRANT ALL ON SCHEMA public TO public');
      
      console.log('✅ Public schema dropped and recreated');
      
      // 3. Recreate the schema using drizzle-kit push (programmatically)
      console.log('🏗️ Recreating the database schema...');
      
      // Create a new drizzle instance with the client
      const drizzleInstance = drizzle(client);
      
      // Get all table create statements from schema
      const tableNames = Object.values(schema)
        .filter(value => typeof value === 'object' && value !== null && '$table' in value)
        .map(table => (table as any).$table.name);
      
      console.log(`📋 Tables to be created: ${tableNames.join(', ')}`);
      
      // 4. Let the user know to run db:push to create the tables
      console.log('📝 Schema reset complete!');
      console.log('⚠️ Now run "npm run db:push" to create the tables according to your schema');
    } finally {
      client.release();
    }
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase();