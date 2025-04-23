import { useState, useEffect } from "react";
import { 
  Heart, 
  Clock, 
  Users, 
  ChefHat, 
  Utensils, 
  Timer, 
  Plus, 
  Minus, 
  RotateCcw, 
  Printer, 
  Share2, 
  MessageSquareWarning, 
  ShoppingCart,
  Eye,
  EyeOff,
  PanelLeftClose,
  Check,
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Fire
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  image?: string;
  aisle?: string;
}

interface RecipeStep {
  number: number;
  step: string;
  ingredients?: {
    id: number;
    name: string;
    image?: string;
  }[];
  equipment?: {
    id: number;
    name: string;
    image?: string;
  }[];
  length?: {
    number: number;
    unit: string;
  };
}

interface RecipeDetailProps {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  instructions?: string;
  analyzedInstructions?: {
    steps: RecipeStep[];
  }[];
  extendedIngredients: Ingredient[];
  nutrition?: {
    nutrients: Nutrient[];
  };
  cuisines?: string[];
  diets?: string[];
  dishTypes?: string[];
  occasions?: string[];
  winePairing?: {
    pairedWines: string[];
    pairingText: string;
  };
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  sustainable?: boolean;
  lowFodmap?: boolean;
  weightWatcherSmartPoints?: number;
  gaps?: string;
  healthScore?: number;
  creditsText?: string;
  license?: string;
  sourceName?: string;
  sourceUrl?: string;
  spoonacularSourceUrl?: string;
  cheap?: boolean;
  veryPopular?: boolean;
  aggregateLikes?: number;
  pricePerServing?: number;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onAddToShoppingList?: (ingredients: Ingredient[]) => void;
}

export function RecipeDetail({
  id,
  title,
  image,
  readyInMinutes,
  servings,
  summary,
  instructions,
  analyzedInstructions,
  extendedIngredients,
  nutrition,
  cuisines = [],
  diets = [],
  dishTypes = [],
  occasions = [],
  winePairing,
  vegetarian = false,
  vegan = false,
  glutenFree = false,
  dairyFree = false,
  sustainable = false,
  lowFodmap = false,
  healthScore,
  creditsText,
  sourceName,
  sourceUrl,
  cheap = false,
  pricePerServing = 0,
  isSaved = false,
  onSaveToggle,
  onAddToShoppingList,
}: RecipeDetailProps) {
  const [currentTab, setCurrentTab] = useState("overview");
  const [servingCount, setServingCount] = useState(servings);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isMobile = useMobile();
  
  // State for tracked ingredients while cooking
  const [usedIngredients, setUsedIngredients] = useState<Record<number, boolean>>({});
  
  // Get recipe steps from analyzed instructions
  const getSteps = (): RecipeStep[] => {
    if (!analyzedInstructions || analyzedInstructions.length === 0) {
      return [];
    }
    
    return analyzedInstructions[0].steps || [];
  };
  
  const recipeSteps = getSteps();
  
  // Format summary by removing HTML tags
  const cleanSummary = summary?.replace(/<[^>]*>/g, "");
  
  // Calculate scaled ingredient amounts
  const calculateScaledAmount = (amount: number): string => {
    const scaleFactor = servingCount / servings;
    const scaledAmount = amount * scaleFactor;
    
    // Format to at most 2 decimal places
    return scaledAmount % 1 === 0
      ? scaledAmount.toString()
      : scaledAmount.toFixed(2).replace(/\.00$/, "").replace(/\.0$/, "");
  };
  
  // Get main macronutrients
  const getMacronutrient = (name: string): Nutrient | undefined => {
    return nutrition?.nutrients.find(
      (nutrient) => nutrient.name.toLowerCase() === name.toLowerCase()
    );
  };
  
  const calories = getMacronutrient("Calories");
  const protein = getMacronutrient("Protein");
  const carbs = getMacronutrient("Carbohydrates");
  const fat = getMacronutrient("Fat");
  
  // Format price
  const formatPrice = (price: number): string => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Toggle step completion
  const toggleStep = (stepNumber: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };
  
  // Toggle ingredient used state
  const toggleIngredient = (id: number) => {
    setUsedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  
  // Calculate recipe progress
  const calculateProgress = (): number => {
    if (recipeSteps.length === 0) return 0;
    
    const completedSteps = Object.values(checkedSteps).filter(Boolean).length;
    return Math.round((completedSteps / recipeSteps.length) * 100);
  };
  
  // Reset cooking progress
  const resetProgress = () => {
    setCheckedSteps({});
    setUsedIngredients({});
    setCurrentStep(0);
  };
  
  // Navigate to next/previous step in cooking mode
  const goToNextStep = () => {
    if (currentStep < recipeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      toggleStep(recipeSteps[currentStep].number);
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Print recipe
  const printRecipe = () => {
    window.print();
  };
  
  // Share recipe
  const shareRecipe = async () => {
    const shareData = {
      title: `Recipe: ${title}`,
      text: `Check out this recipe for ${title}!`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };
  
  // Add all ingredients to shopping list
  const addToShoppingList = () => {
    if (onAddToShoppingList) {
      onAddToShoppingList(extendedIngredients);
      toast.success("Ingredients added to shopping list!");
    }
  };
  
  // Handle favorite toggle with animation
  const handleFavoriteToggle = () => {
    if (onSaveToggle) {
      onSaveToggle();
    }
  };
  
  // Exit cooking mode
  const exitCookingMode = () => {
    setCookingMode(false);
  };
  
  // Get nutrient by name helper function
  const getNutrientValue = (name: string): string => {
    const nutrient = nutrition?.nutrients.find(
      (n) => n.name.toLowerCase() === name.toLowerCase()
    );
    
    if (!nutrient) return "N/A";
    
    return `${Math.round(nutrient.amount)}${nutrient.unit}`;
  };
  
  // Group ingredients by aisle
  const groupedIngredients = extendedIngredients.reduce((groups: Record<string, Ingredient[]>, ingredient) => {
    const aisle = ingredient.aisle || "Other";
    if (!groups[aisle]) {
      groups[aisle] = [];
    }
    groups[aisle].push(ingredient);
    return groups;
  }, {});

  return (
    <div className="w-full mx-auto">
      {/* Cooking Mode */}
      <AnimatePresence>
        {cookingMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-white dark:bg-gray-950 z-50 overflow-auto"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <header className="border-b sticky top-0 bg-white dark:bg-gray-950 z-10 px-4 py-3 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={exitCookingMode}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold truncate max-w-[60%]">{title}</h2>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={calculateProgress()} 
                    className="w-24 h-2" 
                  />
                  <span className="text-sm text-muted-foreground">
                    {calculateProgress()}%
                  </span>
                </div>
              </header>
              
              <div className="flex-1 overflow-auto">
                <div className="container max-w-4xl mx-auto p-4">
                  {/* Current step */}
                  <div className="mb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {currentStep + 1} of {recipeSteps.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left column - ingredients for this step */}
                    <div>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Ingredients for this step</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {recipeSteps[currentStep]?.ingredients && recipeSteps[currentStep].ingredients.length > 0 ? (
                            <ul className="space-y-2">
                              {recipeSteps[currentStep].ingredients.map((item) => {
                                const fullIngredient = extendedIngredients.find(
                                  (ing) => ing.id === item.id
                                );
                                const isUsed = usedIngredients[item.id] || false;
                                
                                return (
                                  <li 
                                    key={item.id}
                                    className={cn(
                                      "flex items-start p-2 rounded-md transition-colors",
                                      isUsed ? "bg-muted/50" : "hover:bg-muted/30"
                                    )}
                                    onClick={() => toggleIngredient(item.id)}
                                  >
                                    <Checkbox 
                                      checked={isUsed}
                                      className="mt-0.5 mr-2"
                                    />
                                    <div>
                                      <span className={cn(
                                        isUsed && "line-through text-muted-foreground"
                                      )}>
                                        {fullIngredient ? (
                                          <>
                                            <span className="font-medium">
                                              {calculateScaledAmount(fullIngredient.amount)} {fullIngredient.unit}
                                            </span>{' '}
                                            {fullIngredient.name}
                                          </>
                                        ) : (
                                          item.name
                                        )}
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground text-sm py-2">
                              No specific ingredients for this step.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Equipment */}
                      {recipeSteps[currentStep]?.equipment && recipeSteps[currentStep].equipment.length > 0 && (
                        <Card className="mt-4">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Equipment</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {recipeSteps[currentStep].equipment.map((item) => (
                                <li 
                                  key={item.id}
                                  className="flex items-center gap-2"
                                >
                                  <Utensils className="h-4 w-4 text-muted-foreground" />
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Timer */}
                      {recipeSteps[currentStep]?.length && (
                        <Card className="mt-4">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Timer className="h-5 w-5 mr-2 text-muted-foreground" />
                                <span>
                                  {recipeSteps[currentStep].length.number} {recipeSteps[currentStep].length.unit}
                                </span>
                              </div>
                              <Button size="sm" variant="outline">
                                Start Timer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* Right column - step instructions */}
                    <div className="md:col-span-2">
                      <Card className="shadow-md">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">
                              {recipeSteps[currentStep]?.number}. {recipeSteps[currentStep]?.step ? "Ready?" : "Finished!"}
                            </CardTitle>
                            {recipeSteps[currentStep]?.length && (
                              <CardDescription>
                                Approx. {recipeSteps[currentStep].length.number} {recipeSteps[currentStep].length.unit}
                              </CardDescription>
                            )}
                          </div>
                          <Checkbox 
                            checked={checkedSteps[recipeSteps[currentStep]?.number] || false}
                            onCheckedChange={() => toggleStep(recipeSteps[currentStep]?.number)}
                            className="h-5 w-5"
                          />
                        </CardHeader>
                        <CardContent>
                          {recipeSteps[currentStep]?.step ? (
                            <p className="text-lg leading-relaxed">
                              {recipeSteps[currentStep].step}
                            </p>
                          ) : (
                            <div className="text-center py-8">
                              <CheckSquare className="h-16 w-16 mx-auto text-primary mb-4" />
                              <h3 className="text-2xl font-bold mb-2">All Done!</h3>
                              <p className="text-muted-foreground mb-6">
                                You've completed all steps in the recipe.
                              </p>
                              <Button variant="outline" onClick={exitCookingMode}>
                                Exit Cooking Mode
                              </Button>
                            </div>
                          )}
                        </CardContent>
                        
                        {recipeSteps[currentStep]?.step && (
                          <CardFooter className="flex justify-between pt-2">
                            <Button
                              variant="outline"
                              onClick={goToPrevStep}
                              disabled={currentStep === 0}
                            >
                              Previous
                            </Button>
                            <Button
                              onClick={goToNextStep}
                              disabled={currentStep === recipeSteps.length - 1}
                            >
                              {currentStep === recipeSteps.length - 1 ? "Finish" : "Next"}
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom controls */}
              <div className="border-t p-4 sticky bottom-0 bg-white dark:bg-gray-950">
                <div className="container max-w-4xl mx-auto flex justify-between items-center">
                  <Button variant="outline" onClick={resetProgress}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  
                  <Button variant="outline" onClick={exitCookingMode}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Exit
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Regular View */}
      <div className="container max-w-6xl mx-auto">
        {/* Hero section */}
        <div className="relative mb-8 rounded-xl overflow-hidden">
          <div className="h-64 md:h-96 relative">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{readyInMinutes} mins</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{servings} servings</span>
                  </div>
                  {healthScore && (
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>{healthScore} health score</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="shadow-lg"
                  onClick={() => setCookingMode(true)}
                >
                  <ChefHat className="mr-2 h-4 w-4" />
                  Start Cooking
                </Button>
                
                {onSaveToggle && (
                  <Button
                    variant={isSaved ? "default" : "secondary"}
                    className={cn(
                      "shadow-lg",
                      isSaved && "bg-rose-500 hover:bg-rose-600"
                    )}
                    onClick={handleFavoriteToggle}
                  >
                    <Heart
                      className={cn("h-4 w-4 mr-2", isSaved && "fill-white")}
                    />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={printRecipe}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={shareRecipe}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          {onAddToShoppingList && (
            <Button variant="outline" size="sm" onClick={addToShoppingList}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Shopping List
            </Button>
          )}
          
          <div className="flex-1" />
          
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServingCount(Math.max(1, servingCount - 1))}
              disabled={servingCount <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm">{servingCount} servings</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServingCount(servingCount + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Tag section */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {diets.map((diet) => (
              <Badge key={diet} variant="secondary">
                {diet}
              </Badge>
            ))}
            {vegetarian && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Vegetarian
              </Badge>
            )}
            {vegan && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                Vegan
              </Badge>
            )}
            {glutenFree && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                Gluten-Free
              </Badge>
            )}
            {dairyFree && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Dairy-Free
              </Badge>
            )}
            {sustainable && (
              <Badge variant="secondary" className="bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300">
                Sustainable
              </Badge>
            )}
            {lowFodmap && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Low FODMAP
              </Badge>
            )}
            {cheap && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300">
                Budget-Friendly
              </Badge>
            )}
          </div>
        </div>
        
        {/* Main content tabs */}
        <Tabs
          defaultValue="overview"
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <div className="border-b sticky top-0 bg-white dark:bg-gray-950 z-10 pb-0">
            <TabsList className="w-full justify-start rounded-none h-12">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                Overview
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                Ingredients
              </TabsTrigger>
              <TabsTrigger value="instructions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                Instructions
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                Nutrition
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>About this Recipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {cleanSummary}
                    </p>
                    
                    {/* Recipe metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      {cuisines && cuisines.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Cuisine</h4>
                          <p className="text-muted-foreground">
                            {cuisines.join(", ")}
                          </p>
                        </div>
                      )}
                      
                      {dishTypes && dishTypes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Dish Type</h4>
                          <p className="text-muted-foreground">
                            {dishTypes.join(", ")}
                          </p>
                        </div>
                      )}
                      
                      {occasions && occasions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Occasions</h4>
                          <p className="text-muted-foreground">
                            {occasions.join(", ")}
                          </p>
                        </div>
                      )}
                      
                      {pricePerServing > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Cost per Serving</h4>
                          <p className="text-muted-foreground">
                            {formatPrice(pricePerServing)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Wine pairing */}
                    {winePairing && winePairing.pairedWines && winePairing.pairedWines.length > 0 && (
                      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <h4 className="font-medium flex items-center">
                          <span className="mr-2">🍷</span> Wine Pairing
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          {winePairing.pairingText}
                        </p>
                        {winePairing.pairedWines.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {winePairing.pairedWines.map((wine) => (
                              <Badge key={wine} variant="outline" className="bg-white/50 dark:bg-gray-800/50">
                                {wine}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    {sourceName && (
                      <div>
                        Source: {sourceUrl ? (
                          <a 
                            href={sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {sourceName}
                          </a>
                        ) : (
                          sourceName
                        )}
                      </div>
                    )}
                  </CardFooter>
                </Card>
                
                {/* Quick ingredient overview */}
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Ingredients</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentTab("ingredients")}
                        className="text-primary"
                      >
                        See all
                      </Button>
                    </div>
                    <CardDescription>For {servingCount} servings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {extendedIngredients.slice(0, 6).map((ingredient) => (
                        <li key={ingredient.id} className="flex justify-between">
                          <span>{ingredient.name}</span>
                          <span className="text-muted-foreground">
                            {calculateScaledAmount(ingredient.amount)} {ingredient.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {extendedIngredients.length > 6 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-primary"
                        onClick={() => setCurrentTab("ingredients")}
                      >
                        +{extendedIngredients.length - 6} more ingredients
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Sidebar information */}
              <div>
                {/* Nutrition card */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Nutrition</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentTab("nutrition")}
                        className="text-primary"
                      >
                        Details
                      </Button>
                    </div>
                    <CardDescription>Per serving</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {calories && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Calories</span>
                            <span className="text-sm">{Math.round(calories.amount)} {calories.unit}</span>
                          </div>
                          <Progress value={calories.percentOfDailyNeeds} className="h-2" />
                        </div>
                      )}
                      
                      {protein && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Protein</span>
                            <span className="text-sm">{Math.round(protein.amount)} {protein.unit}</span>
                          </div>
                          <Progress value={protein.percentOfDailyNeeds} className="h-2" />
                        </div>
                      )}
                      
                      {carbs && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Carbs</span>
                            <span className="text-sm">{Math.round(carbs.amount)} {carbs.unit}</span>
                          </div>
                          <Progress value={carbs.percentOfDailyNeeds} className="h-2" />
                        </div>
                      )}
                      
                      {fat && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Fat</span>
                            <span className="text-sm">{Math.round(fat.amount)} {fat.unit}</span>
                          </div>
                          <Progress value={fat.percentOfDailyNeeds} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    {/* Other key nutrients */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Fiber</span>
                        <p className="font-medium">{getNutrientValue("Fiber")}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Sugar</span>
                        <p className="font-medium">{getNutrientValue("Sugar")}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Sodium</span>
                        <p className="font-medium">{getNutrientValue("Sodium")}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Cholesterol</span>
                        <p className="font-medium">{getNutrientValue("Cholesterol")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Health Tips */}
                {healthScore && (
                  <Card className="mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle>Health Score: {healthScore}/100</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={cn(
                        "p-4 rounded-lg flex gap-3 mb-4",
                        healthScore >= 70 
                          ? "bg-green-50 dark:bg-green-900/20"
                          : healthScore >= 40
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                      )}>
                        <div className={cn(
                          "flex-shrink-0",
                          healthScore >= 70 
                            ? "text-green-500" 
                            : healthScore >= 40
                              ? "text-amber-500"
                              : "text-red-500"
                        )}>
                          {healthScore >= 70 ? (
                            <Lightbulb className="h-5 w-5" />
                          ) : healthScore >= 40 ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <Fire className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm",
                            healthScore >= 70 
                              ? "text-green-700 dark:text-green-300" 
                              : healthScore >= 40
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-red-700 dark:text-red-300"
                          )}>
                            {healthScore >= 70 
                              ? "This recipe is very nutritious!" 
                              : healthScore >= 40
                                ? "This recipe is moderately healthy."
                                : "This recipe is less nutritious and should be enjoyed in moderation."}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">
                            {diets.includes("low carb") || (carbs && carbs.amount < 40) 
                              ? "Low in carbohydrates" 
                              : "Contains essential carbohydrates"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm">
                            {protein && protein.amount > 20 
                              ? "High in protein" 
                              : "Contains some protein"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                          <span className="text-sm">
                            {fat && fat.amount < 15 
                              ? "Low in fat" 
                              : "Contains healthy fats"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Cooking controls */}
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <Button className="w-full" onClick={() => setCookingMode(true)}>
                      <ChefHat className="mr-2 h-4 w-4" />
                      Start Cooking Mode
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Step-by-step instructions with timers and interactive checklist
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Ingredients Tab */}
          <TabsContent value="ingredients" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Ingredients</CardTitle>
                    <CardDescription>
                      For {servingCount} servings ({extendedIngredients.length} ingredients total)
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="servings">Adjust servings:</Label>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => setServingCount(Math.max(1, servingCount - 1))}
                        disabled={servingCount <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 px-3 h-8 flex items-center justify-center min-w-[3rem] text-center border border-input">
                        {servingCount}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => setServingCount(servingCount + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Ingredient list by aisle */}
                <div className="space-y-6">
                  {Object.entries(groupedIngredients).map(([aisle, ingredients]) => (
                    <div key={aisle}>
                      <h3 className="font-medium mb-3 text-lg">{aisle}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ingredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                          >
                            {ingredient.image && (
                              <div className="mr-3 h-10 w-10 flex-shrink-0">
                                <img
                                  src={`https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}`}
                                  alt={ingredient.name}
                                  className="h-full w-full object-cover rounded-md"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <span className="font-medium">{ingredient.name}</span>
                              <span className="block text-sm text-muted-foreground">
                                {calculateScaledAmount(ingredient.amount)} {ingredient.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-between">
                <div className="text-sm text-muted-foreground">
                  *Ingredient amounts are adjusted based on servings
                </div>
                
                {onAddToShoppingList && (
                  <Button size="sm" onClick={addToShoppingList}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add All to Shopping List
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Instructions Tab */}
          <TabsContent value="instructions" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Instructions</CardTitle>
                    <CardDescription>
                      Step-by-step cooking instructions
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="checkable-steps"
                      checked={Object.keys(checkedSteps).length > 0}
                      onCheckedChange={() => 
                        Object.keys(checkedSteps).length > 0 
                          ? setCheckedSteps({}) 
                          : {}
                      }
                    />
                    <Label htmlFor="checkable-steps" className="text-sm">
                      Track Progress
                    </Label>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={() => setCookingMode(true)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Cooking Mode
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recipeSteps.length > 0 ? (
                  <>
                    {/* Progress bar if tracking */}
                    {Object.keys(checkedSteps).length > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-1">
                          <span>
                            {Object.values(checkedSteps).filter(Boolean).length} of {recipeSteps.length} steps completed
                          </span>
                          <span>{calculateProgress()}%</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-2" />
                      </div>
                    )}
                    
                    <ol className="space-y-6 ml-0 pl-0">
                      {recipeSteps.map((step) => (
                        <li
                          key={step.number}
                          className={cn(
                            "relative pl-9",
                            Object.keys(checkedSteps).length > 0 &&
                              checkedSteps[step.number] &&
                              "text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-0 top-1 flex items-center justify-center h-6 w-6 rounded-full text-sm",
                              Object.keys(checkedSteps).length > 0
                                ? checkedSteps[step.number]
                                  ? "bg-primary text-white"
                                  : "border border-primary text-primary"
                                : "bg-primary/10 text-primary"
                            )}
                            onClick={() => toggleStep(step.number)}
                          >
                            {Object.keys(checkedSteps).length > 0 && checkedSteps[step.number] ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              step.number
                            )}
                          </span>
                          
                          <div className="space-y-2">
                            <p className={cn(
                              "text-lg",
                              Object.keys(checkedSteps).length > 0 &&
                                checkedSteps[step.number] &&
                                "line-through decoration-1"
                            )}>
                              {step.step}
                            </p>
                            
                            {/* Equipment and ingredients for this step */}
                            <div className="flex flex-wrap gap-4 mt-2">
                              {step.equipment && step.equipment.length > 0 && (
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">
                                    Equipment:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {step.equipment.map((item) => (
                                      <Badge
                                        key={item.id}
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                      >
                                        {item.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {step.ingredients && step.ingredients.length > 0 && (
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">
                                    Ingredients:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {step.ingredients.map((item) => (
                                      <Badge
                                        key={item.id}
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                      >
                                        {item.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Step timer */}
                            {step.length && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                <Timer className="h-4 w-4" />
                                <span>
                                  {step.length.number} {step.length.unit}
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : instructions ? (
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: instructions }}
                  />
                ) : (
                  <Alert variant="destructive">
                    <MessageSquareWarning className="h-4 w-4" />
                    <AlertTitle>Instructions not available</AlertTitle>
                    <AlertDescription>
                      This recipe doesn't include instructions.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="border-t">
                <Button size="sm" onClick={() => setCookingMode(true)}>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Start Cooking Mode
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Facts</CardTitle>
                <CardDescription>
                  Per serving (based on {servings} servings)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nutrition ? (
                  <div className="space-y-6">
                    {/* Main nutrition panel */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-4 border-b">
                        <h3 className="text-xl font-bold">Nutrition Facts</h3>
                        <p className="text-sm text-muted-foreground">Serving Size: 1 serving</p>
                      </div>
                      
                      <div className="px-4 py-2 border-b flex justify-between">
                        <span className="font-bold">Calories</span>
                        <span>{calories ? Math.round(calories.amount) : "N/A"}</span>
                      </div>
                      
                      <div className="p-4 border-b">
                        <div className="text-right text-sm mb-1">% Daily Value*</div>
                        
                        {/* Fat */}
                        <div className="flex justify-between py-1 border-b">
                          <div>
                            <span className="font-bold">Total Fat</span>{" "}
                            {fat ? `${Math.round(fat.amount)}${fat.unit}` : "N/A"}
                          </div>
                          <div>
                            {fat?.percentOfDailyNeeds
                              ? `${Math.round(fat.percentOfDailyNeeds)}%`
                              : "N/A"}
                          </div>
                        </div>
                        
                        {/* Saturated Fat */}
                        <div className="flex justify-between py-1 border-b pl-4">
                          <div>
                            Saturated Fat{" "}
                            {getNutrientValue("Saturated Fat")}
                          </div>
                          <div>
                            {nutrition.nutrients.find(n => n.name === "Saturated Fat")?.percentOfDailyNeeds
                              ? `${Math.round(nutrition.nutrients.find(n => n.name === "Saturated Fat")!.percentOfDailyNeeds!)}%`
                              : "N/A"}
                          </div>
                        </div>
                        
                        {/* Trans Fat */}
                        <div className="flex justify-between py-1 border-b pl-4">
                          <div>
                            Trans Fat{" "}
                            {getNutrientValue("Trans Fat")}
                          </div>
                          <div>-</div>
                        </div>
                        
                        {/* Cholesterol */}
                        <div className="flex justify-between py-1 border-b">
                          <div>
                            <span className="font-bold">Cholesterol</span>{" "}
                            {getNutrientValue("Cholesterol")}
                          </div>
                          <div>
                            {nutrition.nutrients.find(n => n.name === "Cholesterol")?.percentOfDailyNeeds
                              ? `${Math.round(nutrition.nutrients.find(n => n.name === "Cholesterol")!.percentOfDailyNeeds!)}%`
                              : "N/A"}
                          </div>
                        </div>
                        
                        {/* Sodium */}
                        <div className="flex justify-between py-1 border-b">
                          <div>
                            <span className="font-bold">Sodium</span>{" "}
                            {getNutrientValue("Sodium")}
                          </div>
                          <div>
                            {nutrition.nutrients.find(n => n.name === "Sodium")?.percentOfDailyNeeds
                              ? `${Math.round(nutrition.nutrients.find(n => n.name === "Sodium")!.percentOfDailyNeeds!)}%`
                              : "N/A"}
                          </div>
                        </div>
                        
                        {/* Carbohydrates */}
                        <div className="flex justify-between py-1 border-b">
                          <div>
                            <span className="font-bold">Total Carbohydrates</span>{" "}
                            {carbs ? `${Math.round(carbs.amount)}${carbs.unit}` : "N/A"}
                          </div>
                          <div>
                            {carbs?.percentOfDailyNeeds
                              ? `${Math.round(carbs.percentOfDailyNeeds)}%`
                              : "N/A"}
                          </div>
                        </div>
                        
                        {/* Dietary Fiber */}
                        <div className="flex justify-between py-1 border-b pl-4">
                          <div>
                            Dietary Fiber{" "}
                            {getNutrientValue("Fiber")}
                          </div>
                          <div>
                            {nutrition.nutrients.find(n => n.name === "Fiber")?.percentOfDailyNeeds
                              ? `${Math.round(nutrition.nutrients.find(n => n.name === "Fiber")!.percentOfDailyNeeds!)}%`
                              : "N/A"}
                          </div>
                        </div>
                        
                        {/* Sugars */}
                        <div className="flex justify-between py-1 border-b pl-4">
                          <div>
                            Sugars{" "}
                            {getNutrientValue("Sugar")}
                          </div>
                          <div>-</div>
                        </div>
                        
                        {/* Protein */}
                        <div className="flex justify-between py-1 border-b">
                          <div>
                            <span className="font-bold">Protein</span>{" "}
                            {protein ? `${Math.round(protein.amount)}${protein.unit}` : "N/A"}
                          </div>
                          <div>
                            {protein?.percentOfDailyNeeds
                              ? `${Math.round(protein.percentOfDailyNeeds)}%`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 text-xs text-muted-foreground">
                        * Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
                      </div>
                    </div>
                    
                    {/* Vitamins and Minerals */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Vitamins and Minerals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {nutrition.nutrients
                            .filter(
                              (n) =>
                                !["Calories", "Fat", "Saturated Fat", "Carbohydrates", "Protein", "Sodium", "Cholesterol", "Fiber", "Sugar"].includes(
                                  n.name
                                )
                            )
                            .sort((a, b) => (b.percentOfDailyNeeds || 0) - (a.percentOfDailyNeeds || 0))
                            .slice(0, 10)
                            .map((nutrient) => (
                              <div key={nutrient.name}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">{nutrient.name}</span>
                                  <span className="text-sm">
                                    {Math.round(nutrient.amount)}{nutrient.unit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={nutrient.percentOfDailyNeeds || 0}
                                    className="h-1.5"
                                  />
                                  <span className="text-xs w-8 text-right">
                                    {nutrient.percentOfDailyNeeds
                                      ? `${Math.round(nutrient.percentOfDailyNeeds)}%`
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Alert>
                    <MessageSquareWarning className="h-4 w-4" />
                    <AlertTitle>Nutrition information not available</AlertTitle>
                    <AlertDescription>
                      Detailed nutrition information isn't available for this recipe.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// A Check Square icon component
function CheckSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}