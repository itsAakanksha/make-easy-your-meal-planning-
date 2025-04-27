import { pgTable, serial, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const dietaryPreferences = pgTable('dietary_preferences', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    
    // Dietary restrictions and preferences
    diets: jsonb('diets').$type<string[]>(), // vegetarian, vegan, pescatarian, etc.
    allergies: jsonb('allergies').$type<string[]>(), // nuts, dairy, gluten, etc.
    dislikedIngredients: jsonb('disliked_ingredients').$type<string[]>(),
    preferredIngredients: jsonb('preferred_ingredients').$type<string[]>(),
    
    // Culinary preferences
    preferredCuisines: jsonb('preferred_cuisines').$type<string[]>(), // italian, mexican, thai, etc.
    dislikedCuisines: jsonb('disliked_cuisines').$type<string[]>(),
    
    // Meal planning preferences
    autoGenerateWeeklyPlan: boolean('auto_generate_weekly_plan').default(false),
    maxPrepTimeMinutes: integer('max_prep_time_minutes'),
    prioritizeBudgetFriendly: boolean('prioritize_budget_friendly').default(false),
    
    // Nutritional goals
    calorieTarget: integer('calorie_target'),
    proteinTarget: integer('protein_target'),
    carbTarget: integer('carb_target'),
    fatTarget: integer('fat_target'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dietaryPreferencesRelations = relations(dietaryPreferences, ({ one }) => ({
    user: one(users, {
        fields: [dietaryPreferences.userId],
        references: [users.id],
    }),
}));