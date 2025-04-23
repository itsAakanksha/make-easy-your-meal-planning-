import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { RecipeService } from './recipe';

dotenv.config();

// Check if required environment variables are set
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('Warning: GEMINI_API_KEY is not set in environment variables');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(geminiApiKey || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const recipeService = new RecipeService();

// Define fallback recipes to use when database access fails
const FALLBACK_RECIPES = [
  { id: 716429, title: "Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs", readyInMinutes: 45, type: "dinner" },
  { id: 715538, title: "Vegetable Soup with Black Bean Noodles", readyInMinutes: 35, type: "lunch" },
  { id: 715421, title: "Cheesy Chicken Enchilada Quinoa Casserole", readyInMinutes: 30, type: "dinner" },
  { id: 716429, title: "Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs", readyInMinutes: 45, type: "dinner" },
  { id: 716437, title: "Korean Pork Lettuce Wraps", readyInMinutes: 45, type: "lunch" },
  { id: 716276, title: "Doughnut Breakfast Sandwich", readyInMinutes: 45, type: "breakfast" },
  { id: 716268, title: "African Chicken Peanut Stew", readyInMinutes: 45, type: "dinner" },
  { id: 782600, title: "Quinoa Salad with Vegetables and Cashews", readyInMinutes: 25, type: "lunch" },
  { id: 794349, title: "Broccoli and Chickpea Rice Salad", readyInMinutes: 30, type: "lunch" },
  { id: 715407, title: "Smooth Tomato Basil Soup", readyInMinutes: 55, type: "lunch" },
  { id: 716311, title: "Mango Fried Rice", readyInMinutes: 45, type: "dinner" },
  { id: 715543, title: "Homemade Vanilla Extract", readyInMinutes: 5, type: "breakfast" },
  { id: 644387, title: "Garlicky Kale", readyInMinutes: 45, type: "side" },
  { id: 715392, title: "Chicken Tortilla Soup (Slow Cooker)", readyInMinutes: 310, type: "dinner" },
  { id: 766453, title: "Hummus and Vegetables", readyInMinutes: 45, type: "snack" },
  { id: 716195, title: "Spicy Indian-Style Hummus", readyInMinutes: 45, type: "snack" },
  { id: 782622, title: "Chocolate Peanut Butter Breakfast Shake", readyInMinutes: 15, type: "breakfast" },
  { id: 716195, title: "Spicy Black Bean Hummus", readyInMinutes: 30, type: "snack" },
  { id: 716380, title: "Tofu and Mushroom Lasagna", readyInMinutes: 55, type: "dinner" },
  { id: 660306, title: "Slow Cooker: Pork and Garlic Mashed Potatoes", readyInMinutes: 495, type: "dinner" },
  { id: 716408, title: "Greek-Style Baked Fish: Fresh, Simple, and Delicious", readyInMinutes: 30, type: "lunch" },
  { id: 772899, title: "Jackfruit Fried Rice", readyInMinutes: 50, type: "dinner" },
  { id: 638343, title: "Coconut Milk Steel-Cut Oatmeal", readyInMinutes: 40, type: "breakfast" },
  { id: 716381, title: "Korean Steak Bibimbap", readyInMinutes: 35, type: "dinner" },
];

export interface MealPlanRequest {
  diet?: string;
  allergies?: string[];
  dislikes?: string[];
  cuisinePreferences?: string[];
  goalType?: string;
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  mealCount?: number;
  budgetPerMeal?: number;
  cookingTime?: number;
  servings?: number;
  days?: number;
}

export interface MealPlanDay {
  date: string;
  meals: Array<{
    mealType: string;
    recipeId: number;
    title: string;
  }>;
}

// Helper function to generate a date string for a given number of days from now
function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Fallback function to generate meal plans when the AI or database fails
function generateFallbackMealPlan(preferences: MealPlanRequest): MealPlanDay[] {
  const days = preferences.days || 1;
  const mealsPerDay = preferences.mealCount || 3;
  const mealTypes = ["breakfast", "lunch", "dinner"];
  const result: MealPlanDay[] = [];

  // Get recipes appropriate for specific meal types
  const breakfastRecipes = FALLBACK_RECIPES.filter(r => r.type === "breakfast");
  const lunchRecipes = FALLBACK_RECIPES.filter(r => r.type === "lunch");
  const dinnerRecipes = FALLBACK_RECIPES.filter(r => r.type === "dinner");
  
  // If we don't have enough recipes for a specific meal type, use all recipes
  const getRecipeForType = (type: string) => {
    let recipes;
    
    switch(type) {
      case "breakfast":
        recipes = breakfastRecipes.length > 0 ? breakfastRecipes : FALLBACK_RECIPES;
        break;
      case "lunch":
        recipes = lunchRecipes.length > 0 ? lunchRecipes : FALLBACK_RECIPES;
        break;
      case "dinner":
        recipes = dinnerRecipes.length > 0 ? dinnerRecipes : FALLBACK_RECIPES;
        break;
      default:
        recipes = FALLBACK_RECIPES;
    }
    
    // Return a random recipe from the appropriate list
    return recipes[Math.floor(Math.random() * recipes.length)];
  };

  // Create a meal plan for each day
  for (let i = 0; i < days; i++) {
    const meals = [];
    
    // Add the requested number of meals for each day
    for (let j = 0; j < mealsPerDay; j++) {
      const mealType = mealTypes[j % mealTypes.length];
      const recipe = getRecipeForType(mealType);
      
      meals.push({
        mealType,
        recipeId: recipe.id,
        title: recipe.title
      });
    }
    
    result.push({
      date: getDateString(i),
      meals
    });
  }
  
  return result;
}

export async function generateMealPlan(userPreferences: MealPlanRequest): Promise<MealPlanDay[]> {
  try {
    // First, try to get a pool of recipes that match the user's preferences
    let availableRecipes = [];
    try {
      const recipePool = await recipeService.getRandomRecipes({
        number: 100, // Get a good pool of recipes
        diet: userPreferences.diet,
        tags: [
          ...(userPreferences.cuisinePreferences || []),
          userPreferences.cookingTime ? `maxReadyTime=${userPreferences.cookingTime}` : '',
        ].filter(Boolean)
      });

      // Map recipes to a format that's easier to use in the prompt
      availableRecipes = recipePool.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        readyInMinutes: recipe.readyInMinutes,
        type: guessRecipeType(recipe.title)
      }));
    } catch (dbError) {
      console.error('Error getting random recipes:', dbError);
      // Use fallback recipes if database access fails
      availableRecipes = FALLBACK_RECIPES;
    }

    // If we have no recipes (empty database), use fallbacks
    if (availableRecipes.length === 0) {
      availableRecipes = FALLBACK_RECIPES;
    }

    // Construct prompt with real recipe IDs
    const prompt = constructMealPlanPrompt(userPreferences, availableRecipes);
    
    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response from Gemini
    try {
      // Extract JSON from the text (might be surrounded by markdown code blocks)
      const jsonStr = text.replace(/```json\n|\n```/g, '').trim();
      const mealPlan = JSON.parse(jsonStr) as MealPlanDay[];

      // Validate that all recipe IDs exist in our pool
      let hasInvalidRecipes = false;
      for (const day of mealPlan) {
        for (const meal of day.meals) {
          const recipe = availableRecipes.find(r => r.id === meal.recipeId);
          if (!recipe) {
            console.error(`Invalid recipe ID generated: ${meal.recipeId}`);
            hasInvalidRecipes = true;
            break;
          }
        }
        if (hasInvalidRecipes) break;
      }

      // If we have invalid recipe IDs, use our fallback plan generator
      if (hasInvalidRecipes) {
        console.log("Using fallback meal plan due to invalid recipe IDs");
        return generateFallbackMealPlan(userPreferences);
      }

      return mealPlan;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', `\`\`\`json\n${text}\n\`\`\``);
      
      // Return fallback meal plan on parse error
      console.log("Using fallback meal plan due to parse error");
      return generateFallbackMealPlan(userPreferences);
    }
  } catch (error) {
    console.error('Error generating meal plan with Gemini:', error);
    
    // Return fallback meal plan as a last resort
    console.log("Using fallback meal plan due to Gemini API error");
    return generateFallbackMealPlan(userPreferences);
  }
}

function guessRecipeType(title: string): 'breakfast' | 'lunch' | 'dinner' | undefined {
  const lower = title.toLowerCase();
  
  // Common breakfast keywords
  if (lower.includes('breakfast') || lower.includes('pancake') || lower.includes('waffle') ||
      lower.includes('omelette') || lower.includes('egg') || lower.includes('smoothie') ||
      lower.includes('oatmeal') || lower.includes('cereal') || lower.includes('muffin')) {
    return 'breakfast';
  }
  
  // Common lunch keywords
  if (lower.includes('sandwich') || lower.includes('wrap') || lower.includes('salad') ||
      lower.includes('soup') || lower.includes('bowl')) {
    return 'lunch';
  }
  
  // Common dinner keywords
  if (lower.includes('steak') || lower.includes('roast') || lower.includes('chicken') ||
      lower.includes('fish') || lower.includes('pasta') || lower.includes('curry') ||
      lower.includes('casserole')) {
    return 'dinner';
  }
  
  return undefined;
}

function constructMealPlanPrompt(preferences: MealPlanRequest, availableRecipes: Array<{ id: number; title: string; readyInMinutes: number; type?: string }>): string {
  // Build constraints list
  const formatConstraints = () => {
    let constraints = [];
    
    if (preferences.diet) constraints.push(`Diet type: ${preferences.diet}`);
    if (preferences.allergies?.length) constraints.push(`Allergies (MUST AVOID): ${preferences.allergies.join(', ')}`);
    if (preferences.dislikes?.length) constraints.push(`Disliked foods (avoid if possible): ${preferences.dislikes.join(', ')}`);
    if (preferences.cuisinePreferences?.length) constraints.push(`Preferred cuisines: ${preferences.cuisinePreferences.join(', ')}`);
    if (preferences.goalType) constraints.push(`Nutritional goal: ${preferences.goalType}`);
    if (preferences.calorieTarget) constraints.push(`Target calories per day: ${preferences.calorieTarget}`);
    if (preferences.proteinTarget) constraints.push(`Target protein per day: ${preferences.proteinTarget}g`);
    if (preferences.carbTarget) constraints.push(`Target carbs per day: ${preferences.carbTarget}g`);
    if (preferences.fatTarget) constraints.push(`Target fat per day: ${preferences.fatTarget}g`);
    if (preferences.budgetPerMeal) constraints.push(`Budget per meal: $${(preferences.budgetPerMeal / 100).toFixed(2)}`);
    if (preferences.cookingTime) constraints.push(`Max cooking time: ${preferences.cookingTime} minutes`);
    if (preferences.servings) constraints.push(`Number of servings: ${preferences.servings}`);
    
    return constraints.join('\n- ');
  };

  // Build the prompt
  return `
Generate a detailed meal plan for ${preferences.days || 1} day(s) with ${preferences.mealCount || 3} meals per day that meets these requirements:

- ${formatConstraints()}

The plan MUST follow all dietary restrictions and allergies strictly.

Here are the available recipes you can use (DO NOT use any other recipe IDs):
${availableRecipes.map(recipe => `- ${recipe.id}: "${recipe.title}" (${recipe.readyInMinutes} mins)${recipe.type ? ` [suggested: ${recipe.type}]` : ''}`).join('\n')}

Return your response as a valid JSON array with the following structure:
[
  {
    "date": "2025-04-16", // Format: YYYY-MM-DD
    "meals": [
      {
        "mealType": "breakfast", // breakfast, lunch, dinner, snack
        "recipeId": 123, // Use ONLY IDs from the list above (as NUMBER, not string)
        "title": "Recipe Title" // Use the exact title from the list above
      }
    ]
  }
]

IMPORTANT: 
1. Your response must be ONLY the valid JSON object
2. Use ONLY recipe IDs from the provided list
3. Recipe IDs must be NUMBERS, not strings
4. Match titles exactly with the recipes provided
5. Try to use appropriate recipes for each meal type (breakfast recipes for breakfast, etc.)`;
}