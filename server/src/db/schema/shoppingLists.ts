import { pgTable, serial, integer, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { mealPlans } from './mealPlans';

export const shoppingLists = pgTable('shopping_lists', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    mealPlanId: integer('meal_plan_id').references(() => mealPlans.id), 
    startDate: timestamp('start_date'), 
    endDate: timestamp('end_date'), 
    items: jsonb('items').notNull().$type<Array<{
        id: string; 
        name: string; 
        amount: number; 
        unit: string; 
        aisle: string; 
        recipeIds: number[]; 
        purchased: boolean; 
        notes?: string; 
        addedBy: 'user' | 'system'; 
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