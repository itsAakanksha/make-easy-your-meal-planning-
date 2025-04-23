import { db, storage } from './storage';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Sample recipe data with actual images
const sampleRecipes = [
  {
    title: "Pancakes with Maple Syrup",
    image: "https://spoonacular.com/recipeImages/715567-556x370.jpg",
    readyInMinutes: 20,
    servings: 4,
    instructions: "1. Mix flour, sugar, baking powder, and salt in a bowl.\n2. In another bowl, whisk egg, milk, and melted butter.\n3. Combine wet and dry ingredients.\n4. Heat a lightly oiled griddle over medium heat.\n5. Pour batter onto the griddle in portions.\n6. Cook until bubbles form, then flip and cook until browned.\n7. Serve with maple syrup.",
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 320, unit: "kcal" },
        { name: "Protein", amount: 8, unit: "g" },
        { name: "Fat", amount: 12, unit: "g" },
        { name: "Carbohydrates", amount: 45, unit: "g" }
      ]
    },
    extendedIngredients: [
      { id: 1, name: "All-Purpose Flour", amount: 2, unit: "cups", aisle: "Baking" },
      { id: 2, name: "Sugar", amount: 2, unit: "tablespoons", aisle: "Baking" },
      { id: 3, name: "Baking Powder", amount: 1, unit: "tablespoon", aisle: "Baking" },
      { id: 4, name: "Salt", amount: 0.5, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 5, name: "Milk", amount: 1.5, unit: "cups", aisle: "Dairy" },
      { id: 6, name: "Egg", amount: 1, unit: "", aisle: "Dairy" },
      { id: 7, name: "Butter", amount: 3, unit: "tablespoons", aisle: "Dairy" },
      { id: 8, name: "Maple Syrup", amount: 0.25, unit: "cup", aisle: "Baking" }
    ],
    sourceName: "Sample Recipe Database",
    diets: ["vegetarian"]
  },
  {
    title: "Avocado Toast with Eggs",
    image: "https://spoonacular.com/recipeImages/715421-556x370.jpg",
    readyInMinutes: 15,
    servings: 2,
    instructions: "1. Toast bread until golden and firm.\n2. In a separate pan, fry eggs to your liking.\n3. Mash avocado with lemon juice, salt, and pepper.\n4. Spread avocado on toast and top with eggs.\n5. Sprinkle with salt, pepper, and red pepper flakes if desired.",
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 280, unit: "kcal" },
        { name: "Protein", amount: 12, unit: "g" },
        { name: "Fat", amount: 18, unit: "g" },
        { name: "Carbohydrates", amount: 22, unit: "g" }
      ]
    },
    extendedIngredients: [
      { id: 9, name: "Whole Grain Bread", amount: 2, unit: "slices", aisle: "Bakery/Bread" },
      { id: 10, name: "Avocado", amount: 1, unit: "", aisle: "Produce" },
      { id: 11, name: "Eggs", amount: 2, unit: "", aisle: "Dairy" },
      { id: 12, name: "Lemon Juice", amount: 1, unit: "teaspoon", aisle: "Produce" },
      { id: 13, name: "Salt", amount: 0.25, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 14, name: "Black Pepper", amount: 0.25, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 15, name: "Red Pepper Flakes", amount: 0.25, unit: "teaspoon", aisle: "Spices and Seasonings" }
    ],
    sourceName: "Sample Recipe Database",
    diets: ["vegetarian"]
  },
  {
    title: "Grilled Chicken Salad",
    image: "https://spoonacular.com/recipeImages/715523-556x370.jpg",
    readyInMinutes: 25,
    servings: 2,
    instructions: "1. Season chicken breasts with salt, pepper, and Italian seasoning.\n2. Grill chicken until cooked through.\n3. Let chicken rest, then slice.\n4. In a large bowl, combine lettuce, cucumber, tomatoes, and bell pepper.\n5. Top with sliced chicken and drizzle with olive oil and balsamic vinegar.",
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 350, unit: "kcal" },
        { name: "Protein", amount: 35, unit: "g" },
        { name: "Fat", amount: 15, unit: "g" },
        { name: "Carbohydrates", amount: 12, unit: "g" }
      ]
    },
    extendedIngredients: [
      { id: 16, name: "Chicken Breasts", amount: 2, unit: "", aisle: "Meat" },
      { id: 17, name: "Salt", amount: 0.5, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 18, name: "Black Pepper", amount: 0.25, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 19, name: "Italian Seasoning", amount: 1, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 20, name: "Lettuce", amount: 4, unit: "cups", aisle: "Produce" },
      { id: 21, name: "Cucumber", amount: 1, unit: "", aisle: "Produce" },
      { id: 22, name: "Cherry Tomatoes", amount: 1, unit: "cup", aisle: "Produce" },
      { id: 23, name: "Bell Pepper", amount: 1, unit: "", aisle: "Produce" },
      { id: 24, name: "Olive Oil", amount: 2, unit: "tablespoons", aisle: "Oil, Vinegar, Salad Dressing" },
      { id: 25, name: "Balsamic Vinegar", amount: 1, unit: "tablespoon", aisle: "Oil, Vinegar, Salad Dressing" }
    ],
    sourceName: "Sample Recipe Database",
    diets: ["gluten-free", "low-carb"]
  },
  {
    title: "Spaghetti Bolognese",
    image: "https://spoonacular.com/recipeImages/716429-556x370.jpg",
    readyInMinutes: 45,
    servings: 4,
    instructions: "1. Heat oil in a large pot over medium heat.\n2. Add onion, carrot, and celery and cook until softened.\n3. Add ground beef and cook until browned.\n4. Add garlic and tomato paste and cook for 1 minute.\n5. Add canned tomatoes, beef broth, Italian herbs, salt, and pepper.\n6. Simmer for 30 minutes.\n7. Cook spaghetti according to package instructions.\n8. Serve sauce over spaghetti with grated Parmesan cheese.",
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 480, unit: "kcal" },
        { name: "Protein", amount: 25, unit: "g" },
        { name: "Fat", amount: 15, unit: "g" },
        { name: "Carbohydrates", amount: 60, unit: "g" }
      ]
    },
    extendedIngredients: [
      { id: 26, name: "Olive Oil", amount: 2, unit: "tablespoons", aisle: "Oil, Vinegar, Salad Dressing" },
      { id: 27, name: "Onion", amount: 1, unit: "", aisle: "Produce" },
      { id: 28, name: "Carrot", amount: 1, unit: "", aisle: "Produce" },
      { id: 29, name: "Celery", amount: 1, unit: "stalk", aisle: "Produce" },
      { id: 30, name: "Ground Beef", amount: 1, unit: "pound", aisle: "Meat" },
      { id: 31, name: "Garlic", amount: 3, unit: "cloves", aisle: "Produce" },
      { id: 32, name: "Tomato Paste", amount: 2, unit: "tablespoons", aisle: "Canned and Jarred" },
      { id: 33, name: "Canned Tomatoes", amount: 28, unit: "ounces", aisle: "Canned and Jarred" },
      { id: 34, name: "Beef Broth", amount: 1, unit: "cup", aisle: "Canned and Jarred" },
      { id: 35, name: "Italian Herbs", amount: 1, unit: "tablespoon", aisle: "Spices and Seasonings" },
      { id: 36, name: "Salt", amount: 1, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 37, name: "Black Pepper", amount: 0.5, unit: "teaspoon", aisle: "Spices and Seasonings" },
      { id: 38, name: "Spaghetti", amount: 1, unit: "pound", aisle: "Pasta and Rice" },
      { id: 39, name: "Parmesan Cheese", amount: 0.5, unit: "cup", aisle: "Dairy" }
    ],
    sourceName: "Sample Recipe Database",
    diets: []
  },
  {
    title: "Berry Smoothie Bowl",
    image: "https://spoonacular.com/recipeImages/715397-556x370.jpg",
    readyInMinutes: 10,
    servings: 1,
    instructions: "1. In a blender, combine frozen berries, banana, yogurt, and milk.\n2. Blend until smooth.\n3. Pour into a bowl.\n4. Top with granola, fresh berries, and honey.",
    nutrition: {
      nutrients: [
        { name: "Calories", amount: 320, unit: "kcal" },
        { name: "Protein", amount: 12, unit: "g" },
        { name: "Fat", amount: 5, unit: "g" },
        { name: "Carbohydrates", amount: 60, unit: "g" }
      ]
    },
    extendedIngredients: [
      { id: 40, name: "Frozen Mixed Berries", amount: 1, unit: "cup", aisle: "Frozen" },
      { id: 41, name: "Banana", amount: 1, unit: "", aisle: "Produce" },
      { id: 42, name: "Greek Yogurt", amount: 0.5, unit: "cup", aisle: "Dairy" },
      { id: 43, name: "Milk", amount: 0.25, unit: "cup", aisle: "Dairy" },
      { id: 44, name: "Granola", amount: 0.25, unit: "cup", aisle: "Cereal" },
      { id: 45, name: "Fresh Berries", amount: 0.25, unit: "cup", aisle: "Produce" },
      { id: 46, name: "Honey", amount: 1, unit: "tablespoon", aisle: "Baking" }
    ],
    sourceName: "Sample Recipe Database",
    diets: ["vegetarian"]
  }
];

async function seedRecipes() {
  console.log('Starting to seed recipe database...');

  try {
    // Insert each recipe
    for (const recipe of sampleRecipes) {
      console.log(`Adding recipe: ${recipe.title}`);
      await storage.createRecipe({
        ...recipe,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Recipe database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding recipe database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding function
seedRecipes();