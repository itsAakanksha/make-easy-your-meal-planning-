import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

// Recipes table
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  image: text("image"),
  readyInMinutes: integer("ready_in_minutes").notNull(),
  servings: integer("servings").notNull(),
  instructions: text("instructions").notNull(),
  nutrition: jsonb("nutrition"),
  extendedIngredients: jsonb("extended_ingredients"),
  sourceName: text("source_name"),
  creditsText: text("credits_text"),
  diets: jsonb("diets"),
  cuisines: jsonb("cuisines"), // Adding the cuisines field
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});