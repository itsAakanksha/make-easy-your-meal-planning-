import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, ChevronRight, Utensils, BarChart3, ShoppingCart, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn, getFoodImage } from "@/lib/utils";

// Recipe image cache to avoid unnecessary API calls for the same recipes
const imageCache: Record<string, string> = {};

// Predefined food images for different dish categories for immediate display
const categoryImages = {
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&q=80&w=600",
  lunch: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&q=80&w=600",
  dinner: "https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-4.0.3&q=80&w=600",
  snack: "https://images.unsplash.com/photo-1612558670846-f59e19c7e2e5?ixlib=rb-4.0.3&q=80&w=600"
};

interface MealPlanDay {
  date: string;
  meals: {
    id: string;
    type: string;
    recipe: {
      id: number;
      title: string;
      image: string;
      readyInMinutes: number;
      servings: number;
    };
  }[];
}

interface MealPlanDisplayProps {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days?: MealPlanDay[]; // Make days optional
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  onViewRecipe: (recipeId: number) => void;
  onGenerateShoppingList: () => void;
}

export function MealPlanDisplay({
  id,
  title,
  startDate,
  endDate,
  days = [], // Set default value to empty array
  calories,
  protein,
  carbs,
  fat,
  onViewRecipe,
  onGenerateShoppingList,
}: MealPlanDisplayProps) {
  // Create a state to store dynamically fetched images
  const [recipeImages, setRecipeImages] = useState<Record<string, string>>({});

  // Helper function to convert 7-digit recipe IDs to 6-digit format
  const convertToSixDigitId = (id: number): number => {
    const idStr = id.toString();
    // If it's a 7-digit ID, remove the first digit
    if (idStr.length === 7) {
      return parseInt(idStr.substring(1), 10);
    }
    return id;
  };
  
  // Fetch real images for recipes when component mounts or days change
  useEffect(() => {
    // Skip if no days or meals
    if (!days || days.length === 0) return;
    
    const fetchAllImages = async () => {
      const newImages: Record<string, string> = {};
      
      // Process all meals across all days
      for (const day of days) {
        if (day.meals && day.meals.length > 0) {
          for (const meal of day.meals) {
            // Convert to 6-digit ID for consistency
            const recipeId = convertToSixDigitId(meal.recipe.id).toString();
            const recipeTitle = meal.recipe.title;
            
            // Skip if we already have an image for this recipe or if it's already in the cache
            if (recipeImages[recipeId] || imageCache[recipeId]) continue;
            
            // Use the meal type to get a category image as initial value
            const mealType = meal.type.toLowerCase();
            let categoryImage = categoryImages.dinner; // default
            
            if (mealType.includes('breakfast')) categoryImage = categoryImages.breakfast;
            else if (mealType.includes('lunch')) categoryImage = categoryImages.lunch;
            else if (mealType.includes('snack')) categoryImage = categoryImages.snack;
            
            // Set initial category image
            newImages[recipeId] = categoryImage;
            
            // Try to get a more specific image for this recipe
            try {
              // First check if the provided image URL is valid and not a placeholder
              if (meal.recipe.image && 
                  !meal.recipe.image.includes('placehold.co') && 
                  !meal.recipe.image.includes('placeholder')) {
                // Use the provided image if it's valid
                imageCache[recipeId] = meal.recipe.image;
                newImages[recipeId] = meal.recipe.image;
              } else {
                // Otherwise fetch an image based on recipe title
                const imageUrl = await getFoodImage(recipeTitle);
                if (imageUrl) {
                  imageCache[recipeId] = imageUrl;
                  newImages[recipeId] = imageUrl;
                }
              }
            } catch (err) {
              console.error(`Failed to fetch image for ${recipeTitle}:`, err);
              // Keep the category image as fallback
            }
          }
        }
      }
      
      // Update state with all the new images
      setRecipeImages(prev => ({ ...prev, ...newImages }));
    };
    
    fetchAllImages();
  }, [days]);
  
  // Helper to get the best available image for a recipe
  const getRecipeImage = (recipeId: number, defaultImage: string, mealType: string): string => {
    const id = recipeId.toString();
    
    // First check our dynamically loaded images
    if (recipeImages[id]) return recipeImages[id];
    
    // Then check our cache
    if (imageCache[id]) return imageCache[id];
    
    // If the default image looks valid and is not a placeholder, use it
    if (defaultImage && 
        !defaultImage.includes('placehold.co') && 
        !defaultImage.includes('placeholder')) {
      return defaultImage;
    }
    
    // Fall back to category image based on meal type
    const type = mealType.toLowerCase();
    if (type.includes('breakfast')) return categoryImages.breakfast;
    if (type.includes('lunch')) return categoryImages.lunch;
    if (type.includes('snack')) return categoryImages.snack;
    return categoryImages.dinner;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date";
    
    try {
      const date = new Date(dateString);
      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  // Get weekday name from date string
  const getWeekday = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } catch (e) {
      console.error("Error getting weekday:", e);
      return "";
    }
  };

  // Get meal type label with emoji
  const getMealTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "breakfast":
        return "🍳 Breakfast";
      case "lunch":
        return "🥗 Lunch";
      case "dinner":
        return "🍽️ Dinner";
      case "snack":
        return "🍌 Snack";
      default:
        return `📋 ${type}`;
    }
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Item animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Early return if no meal plan days are available
  if (!days || days.length === 0) {
    return (
      <Card className="shadow-md border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <CardDescription className="text-white/90 mt-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1.5" />
                {formatDate(startDate)} - {formatDate(endDate)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No meal plan data available.</p>
          <Button variant="outline">Generate a Meal Plan</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-white/90 mt-1 flex items-center">
              <Calendar className="h-4 w-4 mr-1.5" />
              {formatDate(startDate)} - {formatDate(endDate)}
            </CardDescription>
          </div>
          
          <Button 
            onClick={onGenerateShoppingList}
            variant="secondary"
            className="bg-white text-indigo-600 hover:bg-white/90"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Shopping List
          </Button>
        </div>
        
        {/* Nutrition summary */}
        {calories && (
          <div className="mt-4 grid grid-cols-4 gap-2 bg-white/10 rounded-lg p-3">
            <div className="text-center">
              <div className="text-sm font-medium text-white/80">Calories</div>
              <div className="text-lg font-bold">{calories} kcal</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white/80">Protein</div>
              <div className="text-lg font-bold">{protein}g</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white/80">Carbs</div>
              <div className="text-lg font-bold">{carbs}g</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white/80">Fat</div>
              <div className="text-lg font-bold">{fat}g</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue={days[0]?.date || "overview"} className="w-full">
          <div className="border-b sticky top-0 bg-white dark:bg-gray-950 z-10">
            <ScrollArea  className="w-full">
              <TabsList className="w-full justify-start px-4 py-2">
                {days.map((day) => (
                  <TabsTrigger
                    key={day.date}
                    value={day.date}
                    className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-950 dark:data-[state=active]:text-indigo-300"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-normal opacity-80">{getWeekday(day.date)}</span>
                      <span className="font-medium">{formatDate(day.date)}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          
          {days.map((day) => (
            <TabsContent key={day.date} value={day.date} className="m-0 p-0">
              <div className="p-4">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {day.meals && day.meals.length > 0 ? (
                    day.meals.map((meal) => (
                      <motion.div
                        key={meal.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="group"
                      >
                        <Card 
                          className="overflow-hidden transition-shadow hover:shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div className="sm:w-1/3 md:w-1/4 relative aspect-video sm:aspect-square">
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                              </div>
                              <img
                                src={getRecipeImage(meal.recipe.id, meal.recipe.image, meal.type)}
                                alt={meal.recipe.title}
                                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  // Get fallback image based on meal type
                                  const type = meal.type.toLowerCase();
                                  if (type.includes('breakfast')) target.src = categoryImages.breakfast;
                                  else if (type.includes('lunch')) target.src = categoryImages.lunch;
                                  else if (type.includes('snack')) target.src = categoryImages.snack;
                                  else target.src = categoryImages.dinner;
                                }}
                              />
                              <Badge className="absolute top-2 left-2 bg-black/60 text-white">
                                {getMealTypeLabel(meal.type)}
                              </Badge>
                            </div>
                            
                            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-indigo-600">
                                  {meal.recipe.title}
                                </h3>
                                
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" />
                                    <span>{meal.recipe.readyInMinutes} min</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Utensils className="mr-1 h-4 w-4" />
                                    <span>{meal.recipe.servings} servings</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -mr-2"
                                  onClick={() => onViewRecipe(convertToSixDigitId(meal.recipe.id))}
                                >
                                  View Recipe
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No meals planned for this day.</p>
                      <Button variant="outline" className="mt-4">
                        Add a Meal
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>{days.length} days, {days.reduce((acc, day) => acc + (day.meals?.length || 0), 0)} meals</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onGenerateShoppingList}
          className="text-xs"
        >
          <ShoppingCart className="mr-2 h-3 w-3" />
          Get Shopping List
        </Button>
      </CardFooter>
    </Card>
  )
}