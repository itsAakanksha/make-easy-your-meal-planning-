import { pgTable, serial, integer, date, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const mealPlans = pgTable('meal_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  planData: jsonb('plan_data').notNull().$type<{
    timeFrame: 'day' | 'week';
    meals: Array<{
      id: string;
      recipeId: number;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      title: string;
      imageUrl?: string;
      readyInMinutes?: number;
      servings?: number;
      date: string;
    }>;
    nutritionSummary?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>(),
  isActive: boolean('is_active').default(true),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
}));