import { pgTable, serial, integer, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  diet: varchar('diet', { length: 50 }),
  allergies: jsonb('allergies').$type<string[]>(),
  dislikes: jsonb('dislikes').$type<string[]>(),
  cuisinePreferences: jsonb('cuisine_preferences').$type<string[]>(),
  goals: jsonb('goals').$type<{
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    goalType?: string;
  }>(),
  maxPrepTime: integer('max_prep_time'),
  mealCount: integer('meal_count').default(3),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));