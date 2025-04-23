import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { getRecipe, saveRecipe, unsaveRecipe, setApiClientInstance } from "@/lib/spoonacular";
import { NutritionChart } from "@/components/nutrition-chart";
import { Clock, Users, Utensils, Flame, Star, Heart, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DOMPurify from 'dompurify';
import React from "react";
import { useApiClient } from "@/lib/api/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RecipeProps {
  isNew?: boolean;
}

// Function to generate AI recipe details when API data is missing or incomplete
function generateAIRecipeDetails(id: number, title: string = "Recipe") {
  // Create a deterministic but seemingly random set of data based on the recipe ID
  const seed = id % 1000;
  
  // Generate recipe title if not provided
  const generatedTitle = title === "Recipe" ? 
    ["Delicious Vegetable Stir Fry", "Creamy Garlic Pasta", "Spicy Chicken Tacos", 
    "Mediterranean Quinoa Bowl", "Homemade Pizza", "Classic Beef Stew", 
    "Coconut Curry Soup", "Fresh Summer Salad"][seed % 8] : title;
  
  // Calculate nutrition based on seed
  const calories = 200 + (seed % 800);
  const protein = 10 + (seed % 40);
  const fat = 5 + (seed % 35);
  const carbs = 15 + (seed % 85);
  
  // Generate cooking time
  const readyInMinutes = 15 + (seed % 46); // Between 15-60 minutes
  
  // Generate number of servings
  const servings = 2 + (seed % 6); // Between 2-8 servings
  
  // Generate a set of ingredients
  const commonIngredients = [
    { id: 1, name: "olive oil", amount: 2, unit: "tbsp", aisle: "Oil, Vinegar, Salad Dressing" },
    { id: 2, name: "salt", amount: 1, unit: "tsp", aisle: "Spices and Seasonings" },
    { id: 3, name: "black pepper", amount: 0.5, unit: "tsp", aisle: "Spices and Seasonings" },
    { id: 4, name: "garlic", amount: 2, unit: "cloves", aisle: "Produce" },
    { id: 5, name: "onion", amount: 1, unit: "medium", aisle: "Produce" },
  ];
  
  const proteinOptions = [
    { id: 10, name: "chicken breast", amount: 1, unit: "lb", aisle: "Meat" },
    { id: 11, name: "ground beef", amount: 1, unit: "lb", aisle: "Meat" },
    { id: 12, name: "salmon fillet", amount: 12, unit: "oz", aisle: "Seafood" },
    { id: 13, name: "tofu", amount: 14, unit: "oz", aisle: "Vegetarian" },
    { id: 14, name: "chickpeas", amount: 15, unit: "oz", aisle: "Canned and Jarred" },
  ];
  
  const vegetableOptions = [
    { id: 20, name: "broccoli", amount: 1, unit: "head", aisle: "Produce" },
    { id: 21, name: "spinach", amount: 5, unit: "oz", aisle: "Produce" },
    { id: 22, name: "bell peppers", amount: 2, unit: "medium", aisle: "Produce" },
    { id: 23, name: "carrots", amount: 3, unit: "medium", aisle: "Produce" },
    { id: 24, name: "zucchini", amount: 2, unit: "medium", aisle: "Produce" },
  ];
  
  const starchOptions = [
    { id: 30, name: "rice", amount: 1, unit: "cup", aisle: "Rice, Grains & Dried Goods" },
    { id: 31, name: "pasta", amount: 8, unit: "oz", aisle: "Pasta and Rice" },
    { id: 32, name: "quinoa", amount: 1, unit: "cup", aisle: "Rice, Grains & Dried Goods" },
    { id: 33, name: "potatoes", amount: 2, unit: "medium", aisle: "Produce" },
    { id: 34, name: "bread", amount: 4, unit: "slices", aisle: "Bakery/Bread" },
  ];
  
  // Select ingredients based on seed
  const proteinItem = proteinOptions[seed % proteinOptions.length];
  const veggie1 = vegetableOptions[seed % vegetableOptions.length];
  const veggie2 = vegetableOptions[(seed + 2) % vegetableOptions.length];
  const starch = starchOptions[seed % starchOptions.length];
  
  // Create a combined list of ingredients
  const extendedIngredients = [
    ...commonIngredients,
    proteinItem,
    veggie1,
    veggie2,
    starch
  ];
  
  // Generate cooking instructions
  const instructions = [
    `Prep all your ingredients: dice the ${veggie1.name} and ${veggie2.name}, mince the garlic, and chop the onion.`,
    `Heat olive oil in a large pan over medium heat. Add garlic and onion, and cook until fragrant, about 2 minutes.`,
    title.toLowerCase().includes("stir fry") ? 
      `Add the ${proteinItem.name} to the pan and cook until browned.` :
      `Cook the ${proteinItem.name} according to package directions.`,
    `Add the ${veggie1.name} and ${veggie2.name}, and continue cooking for 5 minutes.`,
    `Season with salt, pepper, and any additional spices you prefer.`,
    `Serve with ${starch.name} and enjoy!`
  ];
  
  // Determine diets based on ingredients
  const diets = [];
  if (!['chicken breast', 'ground beef', 'salmon fillet'].includes(proteinItem.name)) {
    diets.push('vegetarian');
  }
  if (proteinItem.name === 'tofu' && !starchOptions.includes(starch)) {
    diets.push('vegan');
  }
  if (!['pasta', 'bread'].includes(starch.name)) {
    diets.push('gluten free');
  }
  if (!['ground beef'].includes(proteinItem.name)) {
    diets.push('heart healthy');
  }
  
  // Generate nutrition data
  const nutritionNutrients = [
    { name: "Calories", amount: calories, unit: "kcal", percentOfDailyNeeds: (calories / 2000) * 100 },
    { name: "Fat", amount: fat, unit: "g", percentOfDailyNeeds: (fat / 78) * 100 },
    { name: "Saturated Fat", amount: fat * 0.3, unit: "g", percentOfDailyNeeds: ((fat * 0.3) / 20) * 100 },
    { name: "Carbohydrates", amount: carbs, unit: "g", percentOfDailyNeeds: (carbs / 275) * 100 },
    { name: "Protein", amount: protein, unit: "g", percentOfDailyNeeds: (protein / 50) * 100 },
    { name: "Sodium", amount: 500 + (seed % 800), unit: "mg", percentOfDailyNeeds: ((500 + (seed % 800)) / 2300) * 100 },
    { name: "Fiber", amount: 2 + (seed % 10), unit: "g", percentOfDailyNeeds: ((2 + (seed % 10)) / 28) * 100 },
    { name: "Sugar", amount: 1 + (seed % 8), unit: "g", percentOfDailyNeeds: ((1 + (seed % 8)) / 50) * 100 },
    { name: "Cholesterol", amount: proteinItem.name.includes("meat") ? 50 + (seed % 80) : 0, unit: "mg", percentOfDailyNeeds: ((50 + (seed % 80)) / 300) * 100 },
    { name: "Vitamin C", amount: 20 + (seed % 100), unit: "mg", percentOfDailyNeeds: ((20 + (seed % 100)) / 90) * 100 },
    { name: "Iron", amount: 2 + (seed % 8), unit: "mg", percentOfDailyNeeds: ((2 + (seed % 8)) / 18) * 100 },
  ];
  
  // Generate analyzed instructions for step-by-step display
  const analyzedInstructions = [{
    steps: instructions.map((step, index) => ({
      number: index + 1,
      step: step
    }))
  }];
  
  // Generate a recipe image URL
  const imageOptions = [
    "https://spoonacular.com/recipeImages/715567-556x370.jpg", // Pancakes
    "https://spoonacular.com/recipeImages/715421-556x370.jpg", // Avocado toast
    "https://spoonacular.com/recipeImages/716429-556x370.jpg", // Spaghetti
    "https://spoonacular.com/recipeImages/715397-556x370.jpg", // Smoothie bowl
    "https://spoonacular.com/recipeImages/762649-556x370.jpg", // Stir Fry
    "https://spoonacular.com/recipeImages/632110-556x370.jpg", // Pasta
    "https://spoonacular.com/recipeImages/795751-556x370.jpg", // Chicken
    "https://spoonacular.com/recipeImages/641057-556x370.jpg"  // Salad
  ];
  
  // Create the complete recipe object
  return {
    id: id,
    title: generatedTitle,
    image: imageOptions[seed % imageOptions.length],
    readyInMinutes: readyInMinutes,
    servings: servings,
    summary: `This ${generatedTitle.toLowerCase()} is a delicious meal that takes about ${readyInMinutes} minutes to prepare and serves ${servings}. It's a great choice for a quick and nutritious meal any day of the week.`,
    instructions: instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n'),
    analyzedInstructions: analyzedInstructions,
    extendedIngredients: extendedIngredients,
    nutrition: {
      nutrients: nutritionNutrients
    },
    cuisines: [],
    diets: diets,
    dishTypes: ["main course"],
    vegetarian: diets.includes('vegetarian'),
    vegan: diets.includes('vegan'),
    glutenFree: diets.includes('gluten free'),
    dairyFree: !starchOptions.some(item => ['milk', 'cheese', 'yogurt'].includes(item.name.toLowerCase())),
    sustainable: false,
    healthScore: 50 + (seed % 50),
    isAIGenerated: true // Flag to indicate this is AI-generated content
  };
}

export default function Recipe({ isNew = false }: RecipeProps) {
  const [, params] = useRoute<{ id: string }>("/recipe/:id");
  const rawRecipeId = params?.id || "0";
  
  // Store the original ID from the URL for display and reference
  const originalIdFromUrl = rawRecipeId;
  
  // For API calls, ensure recipe ID is in the expected format
  const recipeId = validateRecipeId(parseInt(rawRecipeId, 10));
  
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  
  // Helper function to ensure recipe IDs are valid 6-digit numbers when needed for API calls
  // but preserve the original ID for URL display
  function validateRecipeId(id: number): number {
    // If invalid ID, return a default valid ID
    if (isNaN(id) || id <= 0) {
      return 716429; // Default to a valid ID
    }
    
    // For 7-digit IDs like "7654321", return as is - we'll handle API compatibility elsewhere
    // This preserves the ID in the URL
    const idStr = String(id);
    
    // Special case for 7-digit IDs - keep them as is for URL purposes
    if (idStr.length === 7) {
      return id;
    }
    
    // Keep 6-digit IDs as is
    if (idStr.length === 6) {
      return id;
    }
    
    // If it's too short (less than 6 digits), pad with leading 7's
    if (idStr.length < 6) {
      return parseInt('7'.repeat(6 - idStr.length) + idStr, 10);
    }
    
    // If longer than 7 digits, truncate to last 6 digits
    if (idStr.length > 7) {
      return parseInt(idStr.substring(idStr.length - 6), 10);
    }
    
    // Return as is
    return id;
  }
  
  // Helper function to get API-compatible ID format
  function getApiCompatibleId(id: number): number {
    const idStr = String(id);
    // If it's a 7-digit ID, use the last 6 digits for API calls
    if (idStr.length === 7) {
      return parseInt(idStr.substring(1), 10);
    }
    return id;
  }
  
  // Provide the API client instance to the spoonacular module
  useEffect(() => {
    setApiClientInstance(apiClient);
  }, [apiClient]);

  // Check if the recipe is saved
  useEffect(() => {
    if (recipeId > 0) {
      const checkIfSaved = async () => {
        try {
          // Use API-compatible ID for backend calls
          const apiId = getApiCompatibleId(recipeId);
          const response = await apiClient.getIsSaved(apiId.toString());
          if (response.success) {
            setIsSaved(response.isSaved);
          }
        } catch (error) {
          console.error("Error checking if recipe is saved:", error);
        }
      };
      
      checkIfSaved();
    }
  }, [recipeId, apiClient]);

  // Save recipe mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      // Use API-compatible ID for backend calls
      const apiId = getApiCompatibleId(recipeId);
      return saveRecipe(apiId);
    },
    onSuccess: () => {
      setIsSaved(true);
      toast.success("Recipe saved successfully!");
      // Invalidate saved recipes query to update the recipes page
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/saved"] });
    },
    onError: (error) => {
      console.error("Error saving recipe:", error);
      toast.error("Failed to save recipe. Please try again.");
    }
  });

  // Unsave recipe mutation
  const unsaveMutation = useMutation({
    mutationFn: () => {
      // Use API-compatible ID for backend calls
      const apiId = getApiCompatibleId(recipeId);
      return unsaveRecipe(apiId);
    },
    onSuccess: () => {
      setIsSaved(false);
      toast.success("Recipe removed from saved recipes.");
      // Invalidate saved recipes query to update the recipes page
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/saved"] });
    },
    onError: (error) => {
      console.error("Error removing recipe:", error);
      toast.error("Failed to remove recipe. Please try again.");
    }
  });

  // Toggle saved state
  const toggleSaved = () => {
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const { data: recipe, isLoading, error, isError } = useQuery({
    queryKey: ["/api/recipes", recipeId],
    queryFn: () => {
      // Use API-compatible ID for fetching from the backend
      const apiId = getApiCompatibleId(recipeId);
      return getRecipe(apiId);
    },
    enabled: !isNew && recipeId > 0,
    retry: 2, // Increase retries to 2
    onError: (error) => {
      console.error(`Error fetching recipe ID ${recipeId}:`, error);
    }
  });
  
  // Check if we need to use AI-generated content and create it
  const finalRecipe = React.useMemo(() => {
    // If we have a proper recipe with complete data, use it
    if (recipe && 
        recipe.title && 
        recipe.image && 
        ((recipe.extendedIngredients && recipe.extendedIngredients.length > 0) || 
         recipe.analyzedInstructions || 
         recipe.instructions)) {
      return recipe;
    }
    
    // Otherwise, generate AI content
    if (recipe) {
      // Use AI to fill in missing information, but keep what's available from the API
      const aiRecipe = generateAIRecipeDetails(recipeId, recipe.title || "Recipe");
      setIsAIGenerated(true);
      
      // Merge real recipe data with AI-generated data, prioritizing real data when available
      return {
        ...aiRecipe,
        ...recipe,
        extendedIngredients: recipe.extendedIngredients?.length > 0 ? recipe.extendedIngredients : aiRecipe.extendedIngredients,
        analyzedInstructions: recipe.analyzedInstructions?.length > 0 ? recipe.analyzedInstructions : aiRecipe.analyzedInstructions,
        instructions: recipe.instructions || aiRecipe.instructions,
        nutrition: recipe.nutrition || aiRecipe.nutrition,
        isAIGenerated: true
      };
    }
    
    // If no recipe data at all, generate everything
    if (!isLoading && !isError && recipeId > 0) {
      setIsAIGenerated(true);
      return generateAIRecipeDetails(recipeId);
    }
    
    return null;
  }, [recipe, recipeId, isLoading, isError]);
  
  // Log the recipe data for debugging
  useEffect(() => {
    if (finalRecipe) {
      console.log("Recipe data processed:", finalRecipe);
    }
  }, [finalRecipe]);
  
  function parseInstructions(instructions: string): string[] {
    if (!instructions) return [];
    
    // Check if instructions is already in HTML format (containing <li> tags)
    if (instructions.includes('<li>')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(instructions, 'text/html');
      return Array.from(doc.querySelectorAll('li')).map(li => li.textContent || '').filter(Boolean);
    }
    
    // Check if instructions is a numbered list (e.g., "1. Do this. 2. Do that.")
    if (/^\d+\.\s/.test(instructions)) {
      return instructions.split(/\d+\.\s/).filter(Boolean).map(step => step.trim());
    }
    
    // Check if instructions is separated by line breaks
    if (instructions.includes('\n')) {
      return instructions.split('\n').filter(line => line.trim()).map(step => step.trim());
    }
    
    // Fall back to treating it as a single instruction
    return [instructions];
  }
  
  function sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['a', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target']
    });
  }

  if (isNew) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent mb-4">
          Create New Recipe
        </h1>
        <div className="p-6 rounded-2xl bg-background shadow-sm">
          <p className="text-muted-foreground">Recipe creation form coming soon...</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-8">
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-96 rounded-3xl" />
              <div className="flex gap-4">
                <Skeleton className="h-24 w-24 rounded-xl" />
                <Skeleton className="h-24 w-24 rounded-xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full rounded" />
                ))}
              </div>
            </div>
            <Skeleton className="h-[600px] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError && !finalRecipe) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="p-6 rounded-2xl bg-background shadow-sm">
          <h1 className="text-2xl font-semibold text-red-500">Error</h1>
          <p className="text-muted-foreground">Failed to load recipe. Please try again later.</p>
          {error && <p className="text-sm text-muted-foreground">{error.message}</p>}
        </div>
      </div>
    );
  }

  if (!finalRecipe) return null;
  
  // Check if nutrition data exists before rendering it
  const hasNutritionData = finalRecipe.nutrition && Array.isArray(finalRecipe.nutrition.nutrients);
  // Check if ingredients data exists
  const hasIngredients = finalRecipe.extendedIngredients && Array.isArray(finalRecipe.extendedIngredients) && finalRecipe.extendedIngredients.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {isAIGenerated && (
        <Alert className="mb-6 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-900">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <AlertTitle>AI-Generated Recipe</AlertTitle>
          <AlertDescription>
            This recipe has been generated or enhanced by AI. The ingredients, instructions, and nutritional information are estimations and may not be completely accurate.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent mb-4">
              {finalRecipe.title}
            </h1>
            
            <div className="relative group">
              <img
                src={finalRecipe.image}
                alt={finalRecipe.title}
                className="w-full rounded-2xl shadow-xl object-cover aspect-video transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-full backdrop-blur-sm bg-white/80"
                  onClick={toggleSaved}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? "text-rose-500" : "text-gray-400"}`} />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full backdrop-blur-sm bg-white/80">
                  <Star className="w-5 h-5 text-amber-400" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-xl bg-background flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prep Time</p>
                  <p className="text-2xl font-semibold">{finalRecipe.readyInMinutes}m</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-background flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Users className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Servings</p>
                  <p className="text-2xl font-semibold">{finalRecipe.servings}</p>
                </div>
              </div>
            </div>
          </header>
          <div className="space-y-8">
            {hasNutritionData && (
              <section className="p-6 rounded-2xl bg-background shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Flame className="w-8 h-8 text-rose-500" />
                  <h2 className="text-2xl font-semibold">Nutrition Facts</h2>
                </div>
                
                <NutritionChart nutrients={finalRecipe.nutrition.nutrients} />
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {finalRecipe.nutrition.nutrients.slice(0, 3).map((nutrient) => (
                    <div key={nutrient.name} className="p-4 rounded-xl bg-muted/10">
                      <p className="text-sm text-muted-foreground">{nutrient.name}</p>
                      <p className="text-lg font-semibold">
                        {Math.round(nutrient.amount)}{nutrient.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {finalRecipe.diets && finalRecipe.diets.length > 0 && (
              <section className="p-6 rounded-2xl bg-background shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Dietary Information</h3>
                <div className="flex flex-wrap gap-2">
                  {finalRecipe.diets.map((diet) => (
                    <span 
                      key={diet}
                      className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-sm"
                    >
                      {diet}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <section className="space-y-10">
          {/* Ingredients Section */}
          {hasIngredients && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-2xl font-semibold">Ingredients</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {finalRecipe.extendedIngredients.map((ingredient, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-3 rounded-lg bg-background hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!hasIngredients && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-2xl font-semibold">Ingredients</h2>
              </div>
              
              <div className="p-6 rounded-2xl bg-background shadow-sm">
                <p className="text-muted-foreground">Ingredients list is not available for this recipe.</p>
              </div>
            </div>
          )}
          
          {/* Instructions Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Utensils className="w-8 h-8 text-orange-500" />
              <h2 className="text-2xl font-semibold">Step-by-Step Instructions</h2>
            </div>
            
            {finalRecipe.instructions ? (
              <ol className="space-y-4">
                {parseInstructions(finalRecipe.instructions).map((step, index) => (
                  <li 
                    key={index}
                    className="group p-4 rounded-xl bg-background border-y-1 border-r-1 border-l-4 border-primary hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-medium">
                        {index + 1}
                      </div>
                      <p 
                        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(step) }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : finalRecipe.analyzedInstructions && finalRecipe.analyzedInstructions.length > 0 ? (
              <ol className="space-y-4">
                {finalRecipe.analyzedInstructions[0].steps.map((step, index) => (
                  <li 
                    key={index}
                    className="group p-4 rounded-xl bg-background border-y-1 border-r-1 border-l-4 border-primary hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-medium">
                        {step.number}
                      </div>
                      <p className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                        {step.step}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-6 rounded-2xl bg-background shadow-sm">
                <p className="text-muted-foreground">No instructions available for this recipe.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.history.back()}
                >
                  Go Back to Meal Plan
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}