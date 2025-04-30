import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const recipeEmbeddings = pgTable('recipe_embeddings_meta', {
  id: serial('id').primaryKey(),
  spoonacularId: integer('spoonacular_id').notNull().unique(),
  title: text('title').notNull(),
  descriptionSnippet: text('description_snippet'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});