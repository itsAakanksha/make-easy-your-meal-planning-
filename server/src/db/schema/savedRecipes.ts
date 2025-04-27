import { integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const savedRecipes = pgTable('saved_recipes', {
  userId: integer('user_id').references(() => users.id).notNull(),
  recipeId: integer('recipe_id').notNull(),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.recipeId] }),
  };
});