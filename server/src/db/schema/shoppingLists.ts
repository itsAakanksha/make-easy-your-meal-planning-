import { pgTable, serial, integer, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { mealPlans } from './mealPlans';

export const shoppingLists = pgTable('shopping_lists', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    mealPlanId: integer('meal_plan_id').references(() => mealPlans.id), // Optional link to a meal plan
    startDate: timestamp('start_date'), // Shopping period start (optional)
    endDate: timestamp('end_date'), // Shopping period end (optional)
    items: jsonb('items').notNull().$type<Array<{
        id: string; // Unique identifier for the item
        name: string; // Ingredient name
        amount: number; // Amount needed
        unit: string; // Unit of measurement
        aisle: string; // Grocery aisle for organization
        recipeIds: number[]; // Spoonacular recipe IDs this item is used in
        purchased: boolean; // Whether the item has been purchased
        notes?: string; // Any additional notes
        addedBy: 'user' | 'system'; // Whether added manually or from recipes
    }>>(),
    isArchived: boolean('is_archived').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shoppingListsRelations = relations(shoppingLists, ({ one }) => ({
    user: one(users, {
        fields: [shoppingLists.userId],
        references: [users.id],
    }),
    mealPlan: one(mealPlans, {
        fields: [shoppingLists.mealPlanId],
        references: [mealPlans.id],
    }),
}));