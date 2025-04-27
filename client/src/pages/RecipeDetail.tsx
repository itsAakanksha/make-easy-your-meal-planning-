import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiClient } from '@/lib/api/client';
import { saveRecipe, unsaveRecipe } from '@/lib/spoonacular';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Clock, 
  Bookmark, 
  Users, 
  ChefHat, 
  Utensils, 
  BookmarkCheck,
  Share2,
  PrinterIcon, 
  ExternalLink,
  Plus
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// Utils & Types
import { cn } from '@/lib/utils';

// Define Ingredient type for better typing
interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  aisle?: string;
}

// Define Nutrient type for better typing
interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

// Define Step type for better typing
interface Step {
  number: number;
  step: string;
  ingredients?: Array<{
    id: number;
    name: string;
    image?: string;
  }>;
  equipment?: Array<{
    id: number;
    name: string;
    image?: string;
  }>;
}

// Recipe detailed interface
interface RecipeDetail {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  nutrition: {
    nutrients: Nutrient[];
  };
  instructions: string;
  analyzedInstructions?: Array<{
    name: string;
    steps: Step[];
  }>;
  extendedIngredients: Ingredient[];
  sourceUrl?: string;
  sourceName?: string;
  creditsText?: string;
  diets?: string[];
  summary?: string;
  dishTypes?: string[];
  occasions?: string[];
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  sustainable?: boolean;
  lowFodmap?: boolean;
  veryHealthy?: boolean;
  cheap?: boolean;
}

// API response interface for recipe detail
interface RecipeDetailResponse {
  success: boolean;
  recipe: RecipeDetail;
}

// API response interface for saved recipes
interface SavedRecipesResponse {
  success: boolean;
  recipes: {
    id: number;
    // Add other properties if needed
  }[];
}

const RecipeDetail = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const [isSaved, setIsSaved] = useState(false);
  const [servingSize, setServingSize] = useState<number>(0);
  
  // Fetch recipe data
  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) throw new Error('Recipe ID is required');
      try {
        // First check if this recipe is saved by the user
        const savedRecipesResponse = await apiClient.get<SavedRecipesResponse>('/recipes/saved');
        if (savedRecipesResponse.success && savedRecipesResponse.recipes) {
          setIsSaved(savedRecipesResponse.recipes.some(r => r.id === parseInt(recipeId)));
        }
        
        // Get the recipe details
        const response = await apiClient.get<RecipeDetailResponse>(`/recipes/${recipeId}`);
        if (!response.success || !response.recipe) {
          throw new Error('Failed to fetch recipe details');
        }
        
        // Set initial serving size based on recipe data
        setServingSize(response.recipe.servings || 2);
        
        return response.recipe;
      } catch (error) {
        console.error('Error fetching recipe:', error);
        throw error;
      }
    },
    enabled: !!recipeId,
  });

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Handle save recipe
  const handleSaveRecipe = async () => {
    if (!recipe) return;
    
    try {
      if (isSaved) {
        await unsaveRecipe(recipe.id);
        setIsSaved(false);
        toast.success('Recipe removed from your collection');
      } else {
        await saveRecipe(recipe.id);
        setIsSaved(true);
        toast.success('Recipe saved to your collection');
      }
    } catch (error) {
      console.error('Error toggling recipe save:', error);
      toast.error('Failed to update recipe. Please try again.');
    }
  };
  
  // Handle add to meal plan
  const handleAddToMealPlan = () => {
    if (recipe) {
      // Navigate to meal plan page with recipe ID as a param
      navigate(`/meal-plan?addRecipe=${recipe.id}`);
      toast.success('Recipe added to meal plan builder');
    }
  };

  // Adjust ingredient amount based on serving size
  const adjustIngredientAmount = (amount: number, originalServings: number) => {
    if (!servingSize || !originalServings) return amount;
    return parseFloat(((amount * servingSize) / originalServings).toFixed(2));
  };

  // Get major nutrients info
  const getMajorNutrient = (name: string): Nutrient | undefined => {
    return recipe?.nutrition?.nutrients?.find(n => 
      n.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Format instructions from HTML or plain text
  const formatInstructions = (instructions: string): string[] => {
    // If the instructions are in HTML format, try to extract text
    if (instructions.includes('<ol>') || instructions.includes('<li>')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = instructions;
      
      // Extract list items
      const listItems = tempDiv.querySelectorAll('li');
      if (listItems.length > 0) {
        return Array.from(listItems).map(li => li.textContent || '').filter(Boolean);
      }
    }
    
    // Otherwise split by periods or line breaks
    const steps = instructions.split(/\.(?=\s|$)|\n/).filter(step => step.trim());
    return steps.map(step => step.trim());
  };

  // Print recipe
  const handlePrint = () => {
    window.print();
  };

  // Share recipe
  const handleShare = async () => {
    if (!recipe) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: window.location.href,
        });
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share recipe');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6 max-w-5xl">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-10 w-3/4 max-w-md" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
          <div className="space-y-6">
            <Skeleton className="w-full h-80 rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          
          <div className="space-y-6">
            <Skeleton className="h-60 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError || !recipe) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Recipe Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The recipe you're looking for doesn't exist or there was an error loading it.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // Extract calories, protein, carbs, and fat
  const calories = getMajorNutrient('calories');
  const protein = getMajorNutrient('protein');
  const carbs = getMajorNutrient('carbohydrates');
  const fat = getMajorNutrient('fat');

  // Get steps from analyzed instructions or format plain text
  const steps: Step[] = recipe.analyzedInstructions?.[0]?.steps || 
                (recipe.instructions ? formatInstructions(recipe.instructions).map((step, idx) => ({
                  number: idx + 1,
                  step
                })) : []);

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl print:py-4">
      {/* Header with back button and title */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="print:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{recipe.title}</h1>
        </div>
        
        <div className="flex items-center space-x-2 print:hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handlePrint}
                >
                  <PrinterIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print recipe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share recipe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isSaved ? "default" : "outline"}
                  size="icon"
                  onClick={handleSaveRecipe}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSaved ? 'Remove from saved recipes' : 'Save recipe'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="default"
            onClick={handleAddToMealPlan}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Meal Plan
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr,2fr] gap-8">
        {/* Left column - Recipe details */}
        <div className="space-y-6">
          {/* Recipe Image */}
          <div 
            className="w-full h-80 bg-cover bg-center rounded-lg" 
            style={{ backgroundImage: `url(${recipe.image})` }}
          />
          
          {/* Recipe info badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center bg-muted rounded-full px-3 py-1 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>{recipe.readyInMinutes} min</span>
            </div>
            
            <div className="flex items-center bg-muted rounded-full px-3 py-1 text-sm">
              <Users className="h-4 w-4 mr-1" />
              <span>{recipe.servings} servings</span>
            </div>
            
            {recipe.dishTypes && recipe.dishTypes.length > 0 && (
              <div className="flex items-center bg-muted rounded-full px-3 py-1 text-sm">
                <ChefHat className="h-4 w-4 mr-1" />
                <span>{recipe.dishTypes[0]}</span>
              </div>
            )}
            
            {recipe.diets && recipe.diets.map(diet => (
              <Badge key={diet} variant="outline" className="rounded-full">
                {diet}
              </Badge>
            ))}
          </div>
          
          {/* Nutrition summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Nutrition per serving</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="space-y-1">
                <div className="text-xl font-semibold">
                  {calories?.amount.toFixed(0) || 0}
                </div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xl font-semibold">
                  {protein?.amount.toFixed(0) || 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">g</span>
                </div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xl font-semibold">
                  {carbs?.amount.toFixed(0) || 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">g</span>
                </div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xl font-semibold">
                  {fat?.amount.toFixed(0) || 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">g</span>
                </div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>
          </Card>
          
          {/* Tabs for Instructions/Nutrition */}
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition Details</TabsTrigger>
            </TabsList>
            
            {/* Instructions tab */}
            <TabsContent value="instructions" className="space-y-4">
              {recipe.summary && (
                <div 
                  className="text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: recipe.summary }}
                />
              )}
              
              <h2 className="text-xl font-semibold">Instructions</h2>
              <div className="space-y-4">
                {steps.length > 0 ? (
                  steps.map((step) => (
                    <div key={step.number} className="flex">
                      <div className="mr-4">
                        <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                          {step.number}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p>{step.step}</p>
                        
                        {/* Show ingredients used in this step if available */}
                        {step.ingredients && step.ingredients.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {step.ingredients.map(ingredient => (
                              <Badge key={ingredient.id} variant="secondary" className="text-xs">
                                {ingredient.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Show equipment used in this step if available */}
                        {step.equipment && step.equipment.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {step.equipment.map(item => (
                              <Badge key={item.id} variant="outline" className="text-xs">
                                <Utensils className="h-3 w-3 mr-1" />
                                {item.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No instructions available for this recipe.</p>
                )}
              </div>
              
              {/* Source attribution */}
              {recipe.sourceUrl && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Recipe from{' '}
                    <a 
                      href={recipe.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      {recipe.sourceName || recipe.creditsText || 'Source'}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Nutrition tab */}
            <TabsContent value="nutrition" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Detailed Nutrition</h2>
              
              {/* Macronutrient breakdown */}
              <div className="space-y-4">
                <h3 className="font-medium">Macronutrients</h3>
                <div className="space-y-3">
                  {['Protein', 'Carbohydrates', 'Fat'].map(nutrientName => {
                    const nutrient = getMajorNutrient(nutrientName);
                    return nutrient ? (
                      <div key={nutrientName} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{nutrientName}</span>
                          <span>{nutrient.amount.toFixed(1)}{nutrient.unit}</span>
                        </div>
                        <Progress 
                          value={nutrient.percentOfDailyNeeds} 
                          className="h-2" 
                        />
                        <div className="text-xs text-right text-muted-foreground">
                          {nutrient.percentOfDailyNeeds?.toFixed(0)}% of daily needs
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <Separator />
              
              {/* Vitamins */}
              <div className="space-y-4">
                <h3 className="font-medium">Vitamins</h3>
                <div className="grid grid-cols-2 gap-4">
                  {recipe.nutrition.nutrients
                    .filter(n => 
                      n.name.includes('Vitamin') || 
                      n.name === 'Folate' ||
                      n.name === 'Choline'
                    )
                    .map(nutrient => (
                      <div key={nutrient.name} className="flex justify-between text-sm">
                        <span>{nutrient.name}</span>
                        <span className="font-medium">
                          {nutrient.amount.toFixed(1)}{nutrient.unit}
                          {nutrient.percentOfDailyNeeds && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({nutrient.percentOfDailyNeeds.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <Separator />
              
              {/* Minerals */}
              <div className="space-y-4">
                <h3 className="font-medium">Minerals</h3>
                <div className="grid grid-cols-2 gap-4">
                  {recipe.nutrition.nutrients
                    .filter(n => 
                      ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium'].includes(n.name)
                    )
                    .map(nutrient => (
                      <div key={nutrient.name} className="flex justify-between text-sm">
                        <span>{nutrient.name}</span>
                        <span className="font-medium">
                          {nutrient.amount.toFixed(1)}{nutrient.unit}
                          {nutrient.percentOfDailyNeeds && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({nutrient.percentOfDailyNeeds.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - Ingredients */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ingredients</h2>
                
                {/* Servings adjuster */}
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setServingSize(Math.max(1, servingSize - 1))}
                  >
                    -
                  </Button>
                  <span>{servingSize} serving{servingSize !== 1 ? 's' : ''}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setServingSize(servingSize + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              {/* Ingredients list */}
              <ul className="space-y-3">
                {recipe.extendedIngredients.map(ingredient => (
                  <li key={ingredient.id} className="flex items-center py-1">
                    <div className="w-12 text-right mr-3">
                      <span className="font-medium">
                        {adjustIngredientAmount(ingredient.amount, recipe.servings)}
                      </span>
                    </div>
                    <div className="w-12 text-left mr-3 text-muted-foreground">
                      {ingredient.unit}
                    </div>
                    <div>{ingredient.name}</div>
                  </li>
                ))}
              </ul>
              
              {/* Add to shopping list button */}
              <div className="mt-6 print:hidden">
                <Button className="w-full">
                  Add to Shopping List
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Equipment needed (if available) */}
          {steps.some(step => step.equipment && step.equipment.length > 0) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Equipment Needed</h3>
                <ul className="space-y-2">
                  {Array.from(new Set(
                    steps
                      .flatMap(step => step.equipment || [])
                      .map(equipment => equipment.name)
                  )).map(equipmentName => (
                    <li key={equipmentName} className="flex items-center">
                      <Utensils className="h-4 w-4 mr-2 text-muted-foreground" />
                      {equipmentName}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Similar recipes or tags */}
          {((recipe.dishTypes && recipe.dishTypes.length > 0) || (recipe.occasions && recipe.occasions.length > 0)) && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.dishTypes?.map(type => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                ))}
                {recipe.occasions?.map(occasion => (
                  <Badge key={occasion} variant="secondary">
                    {occasion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;