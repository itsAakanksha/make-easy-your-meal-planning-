/**
 * Script to populate recipe embeddings in the vector database
 * This script fetches recipes from Spoonacular and creates embeddings for semantic search
 */

import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import { searchRecipes, getRecipeInformation } from '../utils/spoonacular.client';
import { generateEmbedding } from '../utils/embedding.generator';
import { storeEmbedding } from '../utils/vectorDb.client';
import { db } from '../db';
import { recipeEmbeddings } from '../db/schema';

// Number of recipes to fetch and create embeddings for
const RECIPES_TO_FETCH = 100;

/**
 * Fetch popular recipes from various cuisines for a diverse dataset
 */
async function fetchDiverseRecipes() {
  console.log(`Fetching ${RECIPES_TO_FETCH} diverse recipes...`);
  
  // Create queries that include diet-specific categories for better personalization
  const queries = [
    // Regular cuisine-based queries
    { cuisine: 'Italian', query: 'pasta' },
    { cuisine: 'Mexican', query: 'taco' },
    { cuisine: 'American', query: 'burger' },
    { cuisine: 'Indian', query: 'curry' },
    { cuisine: 'Chinese', query: 'stir fry' },
    { cuisine: 'Japanese', query: 'sushi' },
    { cuisine: 'Thai', query: 'pad thai' },
    { cuisine: 'Mediterranean', query: 'falafel' },
    
    // Diet-specific queries for personalization
    { diet: 'vegetarian', query: 'vegetarian meal' },
    { diet: 'vegan', query: 'vegan dinner' },
    { diet: 'gluten free', query: 'gluten free recipe' },
    { diet: 'keto', query: 'keto friendly' },
    
    // Meal-type specific queries
    { type: 'breakfast', query: 'quick breakfast' },
    { type: 'lunch', query: 'easy lunch' },
    { type: 'dinner', query: 'family dinner' },
    
    // Special categories for meal planning
    { query: 'meal prep', cuisine: 'American' },
    { query: 'one pot meal', cuisine: 'Italian' },
    { query: 'under 30 minutes', cuisine: 'Mexican' },
    { query: 'high protein', diet: 'paleo' },
    { query: 'low calorie', diet: 'vegetarian' }
  ];
  
  // Calculate how many recipes to fetch per query
  const recipesPerQuery = Math.ceil(RECIPES_TO_FETCH / queries.length);
  
  // Collect all recipe IDs
  const allRecipeIds: number[] = [];
  
  // Fetch recipes for each query
  for (const query of queries) {
    try {
      const queryDesc = query.diet 
        ? `${query.diet} ${query.query}` 
        : query.type 
          ? `${query.type} ${query.query}` 
          : `${query.cuisine} ${query.query}`;
          
      console.log(`Searching for recipes: "${queryDesc}"...`);
      
      const searchParams: any = {
        query: query.query,
        number: recipesPerQuery
      };
      
      // Add specific parameters based on query type
      if (query.cuisine) searchParams.cuisines = [query.cuisine];
      if (query.diet) searchParams.diet = query.diet;
      if (query.type) searchParams.type = query.type;
      
      const recipes = await searchRecipes(searchParams);
      
      const recipeIds = recipes.map(recipe => recipe.id);
      console.log(`Found ${recipeIds.length} recipes for "${queryDesc}"`);
      
      allRecipeIds.push(...recipeIds);
    } catch (error) {
      console.error(`Error fetching recipes for query "${query.query}":`, error);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Make sure we have no duplicate recipe IDs
  const uniqueRecipeIds = [...new Set(allRecipeIds)];
  console.log(`Fetched ${uniqueRecipeIds.length} unique recipe IDs in total`);
  
  return uniqueRecipeIds;
}

/**
 * Generate and store embeddings for a single recipe
 */
async function processRecipe(recipeId: number): Promise<boolean> {
  try {
    console.log(`Processing recipe ID ${recipeId}...`);
    
    // Fetch complete recipe details
    const recipe = await getRecipeInformation(recipeId);
    
    // Extract nutritional information if available
    const nutritionInfo = recipe.nutrition?.nutrients?.map(nutrient => 
      `${nutrient.name}: ${nutrient.amount}${nutrient.unit}`
    ) || [];
    
    // Format preparation time in a more descriptive way
    const prepTimeDesc = recipe.readyInMinutes 
      ? recipe.readyInMinutes <= 15 
        ? 'quick recipe' 
        : recipe.readyInMinutes <= 30 
          ? 'moderate cooking time' 
          : 'longer preparation time'
      : '';
    
    // Format serving size in a more descriptive way
    const servingDesc = recipe.servings
      ? recipe.servings === 1
        ? 'single serving'
        : recipe.servings <= 2
          ? 'couple serving'
          : recipe.servings <= 4
            ? 'family meal'
            : 'large group meal'
      : '';
    
    // Create a more comprehensive embedding text that captures all recipe aspects
    const embeddingText = [
      // Basic information
      recipe.title,
      recipe.summary,
      recipe.instructions,
      
      // Ingredients (critically important for matching user preferences)
      ...(recipe.extendedIngredients?.map(ing => ing.name) || []),
      
      // Categorizations
      ...(recipe.dishTypes || []),
      ...(recipe.cuisines || []),
      ...(recipe.diets || []),
      
      // Descriptive time and serving information 
      prepTimeDesc,
      servingDesc,
      
      // Nutritional profile for dietary matching
      ...nutritionInfo,
    ].filter(Boolean).join(' ');
    
    if (!embeddingText.trim()) {
      console.warn(`Insufficient recipe data for embedding: ${recipeId}`);
      return false;
    }
    
    // Generate embedding vector
    const embedding = await generateEmbedding(embeddingText);
    if (!embedding || !embedding.length) {
      console.error(`Failed to generate embedding for recipe ${recipeId}`);
      return false;
    }
    
    // Store enhanced metadata for the recipe
    const metadata = {
      title: recipe.title,
      imageUrl: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      diets: recipe.diets || [],
      cuisines: recipe.cuisines || [],
      dishTypes: recipe.dishTypes || [],
      ingredients: recipe.extendedIngredients?.map(ing => ing.name) || [],
      // Store nutrition data if available
      nutrition: recipe.nutrition?.nutrients?.reduce((acc, nutrient) => {
        acc[nutrient.name.toLowerCase().replace(/\s+/g, '_')] = {
          amount: nutrient.amount,
          unit: nutrient.unit
        };
        return acc;
      }, {} as Record<string, {amount: number, unit: string}>) || {}
    };
    
    // Store in the vector database
    await storeEmbedding(recipeId.toString(), embedding, metadata);
    
    // Store mapping in regular database
    await db.insert(recipeEmbeddings)
      .values({
        spoonacularId: recipeId,
        title: recipe.title,
        descriptionSnippet: recipe.summary ? recipe.summary.substring(0, 200) : '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: recipeEmbeddings.spoonacularId,
        set: {
          title: recipe.title,
          descriptionSnippet: recipe.summary ? recipe.summary.substring(0, 200) : '',
          updatedAt: new Date()
        }
      });
    
    console.log(`✅ Successfully processed recipe "${recipe.title}"`);
    return true;
  } catch (error) {
    console.error(`Error processing recipe ${recipeId}:`, error);
    return false;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  console.log('Starting recipe embedding generation...');
  
  try {
    // Get diverse recipe IDs
    const recipeIds = await fetchDiverseRecipes();
    
    // Process recipes with some parallelism but not too much to avoid rate limits
    let successCount = 0;
    const concurrentLimit = 3;
    
    // Process recipes in batches
    for (let i = 0; i < recipeIds.length; i += concurrentLimit) {
      const batch = recipeIds.slice(i, i + concurrentLimit);
      console.log(`Processing batch ${i / concurrentLimit + 1}/${Math.ceil(recipeIds.length / concurrentLimit)}`);
      
      // Process batch concurrently
      const results = await Promise.all(batch.map(id => processRecipe(id)));
      
      // Count successes
      successCount += results.filter(success => success).length;
      
      // Add delay between batches to avoid rate limiting
      if (i + concurrentLimit < recipeIds.length) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Script complete! Successfully processed ${successCount} out of ${recipeIds.length} recipes.`);
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);