import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  UtensilsCrossed, 
  Clock, 
  Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/client';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MealPlan as MealPlanType, MealPlanPreferences } from '@/lib/spoonacular';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Reusable components for meal cards
const MealCard = ({ meal, onRemove, mealType }) => {
  if (!meal) return null;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="relative">
        {meal.imageUrl && (
          <div 
            className="h-36 w-full bg-cover bg-center rounded-t-lg" 
            style={{ backgroundImage: `url(${meal.imageUrl})` }}
          />
        )}
        <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
          {mealType}
        </Badge>
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg line-clamp-1">{meal.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {meal.readyInMinutes && (
            <div className="flex items-center">
              <Clock className="mr-1 h-3.5 w-3.5" />
              <span>{meal.readyInMinutes} min</span>
            </div>
          )}
          {meal.servings && (
            <div className="flex items-center">
              <Users className="mr-1 h-3.5 w-3.5" />
              <span>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button
          variant="link"
          size="sm"
          className="px-0 h-auto"
          asChild
        >
          <Link to={`/recipes/${meal.recipeId}`}>
            View Recipe
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(meal.id)}
        >
          <UtensilsCrossed className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const EmptyMealCard = ({ mealType, selectedDate, formatDateString }) => {
  return (
    <Card className="hover:bg-muted/50 transition-colors h-full">
      <Link 
        to={{
          pathname: "/recipes",
          search: `?addTo=${mealType.toLowerCase()}&date=${formatDateString(selectedDate)}`
        }}
        className="block h-full"
      >
        <div className="flex flex-col items-center justify-center h-full py-8 px-4">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium text-center">Add {mealType}</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Browse recipes to add to your meal plan
          </p>
        </div>
      </Link>
    </Card>
  );
};

const MealPlan = () => {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<MealPlanPreferences>({
    diet: 'balanced',
    calories: 2000,
    excludeIngredients: [],
    mealCount: 3
  });
  const [view, setView] = useState<'day' | 'week'>('day');
  
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  // Check if we're adding a recipe from recipe detail page
  const addRecipeId = searchParams.get('addRecipe');
  
  // Format date to string (YYYY-MM-DD)
  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get meal plan for selected date
  const { data: mealPlan, isLoading, error } = useQuery({
    queryKey: ['mealPlan', selectedDate ? formatDateString(selectedDate) : null],
    queryFn: async () => {
      if (!selectedDate) return null;
      
      try {
        const dateStr = formatDateString(selectedDate);
        console.log("Fetching meal plans for date:", dateStr);
        
        // Call the backend API to get meal plan for the selected date
        const response = await apiClient.get<{ success: boolean, date: string, mealPlans?: any[] }>(`/mealplans/date/${dateStr}`);
        console.log("Got response for date query:", response);
        
        if (response.success && response.mealPlans && response.mealPlans.length > 0) {
          // Take the most recent meal plan if multiple exist
          const mostRecentPlan = response.mealPlans.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
          console.log("Found meal plan:", mostRecentPlan);
          
          // Check if we have meals in the meals property or mealsForRequestedDate property
          let mealsArray = [];
          
          if (mostRecentPlan.meals && mostRecentPlan.meals.length > 0) {
            mealsArray = mostRecentPlan.meals;
          } else if (mostRecentPlan.mealsForRequestedDate && mostRecentPlan.mealsForRequestedDate.length > 0) {
            mealsArray = mostRecentPlan.mealsForRequestedDate;
          }
          
          console.log("Meals for this date:", mealsArray);
          
          // Ensure the meals property is correctly structured
          return {
            id: mostRecentPlan.id,
            date: dateStr,
            meals: mealsArray
          };
        }
        
        // If no meal plan exists for this date, return a default structure
        return {
          id: 0,
          date: dateStr,
          meals: []
        };
      } catch (error) {
        console.error('Error fetching meal plan:', error);
        throw error;
      }
    },
    enabled: !!selectedDate,
  });

  // Generate meal plan mutation
  const generateMealPlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error("No date selected");
      
      const dateStr = formatDateString(selectedDate);
      
      // Create request body with all required properties
      const requestBody = {
        timeFrame: "day",
        targetCalories: preferences.calories,
        diet: preferences.diet || undefined,
        exclude: preferences.excludeIngredients || [],
        preferences: {
          cuisines: [],
          mealCount: preferences.mealCount || 3,
          readyTime: 60
        },
        useUserPreferences: true,
        // Add the selected date to ensure meals are created for this specific date
        date: dateStr
      };
      
      console.log("Generating meal plan with params:", requestBody);
      
      // Call the backend API to generate a meal plan
      return apiClient.post("/mealplans/generate", requestBody);
    },
    onSuccess: (data) => {
      // Close the dialog
      setIsGenerateDialogOpen(false);
      
      console.log("Full meal plan generation response:", data);
      
      // Success message
      toast.success("Meal plan generated successfully!");
      
      // If the response includes meal plan data, let's use it directly
      if (data.success && data.mealPlan && data.mealPlan.meals) {
        console.log("Setting meal plan data in cache:", data.mealPlan);
        
        // Store local copy of the meal plan data in case the cache gets cleared
        const mealPlanData = {
          id: data.mealPlan.id,
          date: formatDateString(selectedDate!),
          meals: data.mealPlan.meals
        };
        
        // Update query cache directly with the new data
        queryClient.setQueryData(
          ['mealPlan', formatDateString(selectedDate!)], 
          mealPlanData
        );
        
        // Prevent automatic refetching that could overwrite our data
        queryClient.setQueryDefaults(['mealPlan', formatDateString(selectedDate!)], {
          staleTime: 60000 // 1 minute
        });
      } else {
        // If we didn't get meal plan data in the response, manually refetch
        queryClient.invalidateQueries({ 
          queryKey: ['mealPlan', formatDateString(selectedDate!)],
          refetchType: 'all'
        });
      }
    },
    onError: (error) => {
      console.error("Error generating meal plan:", error);
      
      // Extract more detailed error information if available
      let errorMessage = "Failed to generate meal plan. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Log detailed error information for debugging
      console.error("Detailed error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      
      toast.error(errorMessage);
    }
  });

  // Navigate to previous/next day/week
  const navigate = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const newDate = new Date(selectedDate);
    
    if (view === 'day') {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    }
    
    setSelectedDate(newDate);
    setDate(newDate);
  };

  // Format date for display (e.g., "Monday, April 5")
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Format date range for week view
  const formatWeekRange = (date: Date): string => {
    const currentDay = date.getDay(); // 0 is Sunday, 6 is Saturday
    const start = new Date(date);
    start.setDate(date.getDate() - currentDay); // Start of week (Sunday)
    
    const end = new Date(date);
    end.setDate(date.getDate() + (6 - currentDay)); // End of week (Saturday)
    
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  // Handle preference changes
  const handlePreferenceChange = (key: keyof MealPlanPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle generate meal plan
  const handleGenerateMealPlan = () => {
    generateMealPlanMutation.mutate();
  };

  // Handle adding a recipe to a meal slot
  const handleAddRecipeToSlot = async (mealType: string, recipeId: number) => {
    if (!selectedDate || !mealPlan) return;
    
    try {
      // Call the API to add a recipe to the meal plan
      const response = await apiClient.post(`/mealplans/${mealPlan.id}/add-recipe`, {
        recipeId,
        mealType
      });
      
      if (response.success) {
        toast.success(`Added recipe to ${mealType.toLowerCase()}`);
        
        // Refresh meal plan data
        queryClient.invalidateQueries({ queryKey: ['mealPlan', formatDateString(selectedDate)] });
      } else {
        toast.error("Failed to add recipe");
      }
    } catch (error) {
      console.error("Error adding recipe to meal plan:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Handle removing a recipe from a meal slot
  const handleRemoveMeal = async (mealId: number) => {
    if (!selectedDate || !mealPlan) return;
    
    try {
      // Call the API to remove a meal
      const response = await apiClient.delete(`/mealplans/meals/${mealId}`);
      
      if (response.success) {
        toast.success("Meal removed successfully");
        
        // Refresh meal plan data
        queryClient.invalidateQueries({ queryKey: ['mealPlan', formatDateString(selectedDate)] });
      } else {
        toast.error("Failed to remove meal");
      }
    } catch (error) {
      console.error("Error removing meal:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };
  
  // Define meal types
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  
  // Create date objects for each day of the current week
  const getWeekDates = (currentDate: Date) => {
    const dates = [];
    const currentDay = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      const dayDiff = i - currentDay;
      date.setDate(date.getDate() + dayDiff);
      dates.push(date);
    }
    
    return dates;
  };
  
  const weekDates = selectedDate ? getWeekDates(selectedDate) : [];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* View toggle and week navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Meal Planner</h1>
        
        <div className="flex items-center gap-2">
          <Tabs defaultValue="day" value={view} onValueChange={(v) => setView(v as 'day' | 'week')} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={() => {
              setDate(new Date());
              setSelectedDate(new Date());
            }}
          >
            Today
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Calendar Card */}
        <Card className="h-fit shadow-md border-muted">
          <CardHeader className="pb-3 bg-muted/40 border-b">
            <CardTitle className="flex items-center text-primary">
              <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
              <span>Calendar</span>
            </CardTitle>
            <CardDescription>
              Select a date to view or edit meals
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                if (date) {
                  setDate(date);
                  setSelectedDate(date);
                }
              }}
              className="rounded-md max-w-full"
              styles={{
                month: { width: '100%' },
                caption: {
                  textTransform: 'capitalize',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                },
                caption_label: {
                  textTransform: 'capitalize',
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  color: 'var(--primary)',
                },
                nav_button: {
                  color: 'var(--primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  padding: '0.25rem',
                },
                table: {
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0.25rem',
                },
                head_cell: {
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '0.5rem 0',
                  color: 'var(--muted-foreground)',
                },
                cell: {
                  padding: 0,
                  position: 'relative',
                  textAlign: 'center',
                  borderRadius: '0.375rem',
                }
              }}
              classNames={{
                day_selected: "bg-primary text-primary-foreground font-bold hover:bg-primary hover:text-primary-foreground ring-0",
                day_today: "bg-accent text-accent-foreground font-bold border border-primary/20",
                day_range_middle: "bg-accent rounded-none",
                day_outside: "text-muted-foreground opacity-50",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md",
                  "transition-all duration-200 ease-in-out"
                ),
                day_disabled: "text-muted-foreground opacity-30 hover:bg-transparent",
                day_hidden: "invisible",
                day_range_end: "bg-primary text-primary-foreground rounded-r-md",
                day_range_start: "bg-primary text-primary-foreground rounded-l-md",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted",
                  "transition-opacity duration-200 ease-in-out"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                cell: cn(
                  "p-0 text-center text-sm relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  "focus-within:relative focus-within:z-20"
                ),
                head_cell: "text-xs font-medium text-muted-foreground",
                head_row: "flex",
                row: "flex w-full mt-2",
                table: "w-full border-collapse space-y-1",
                month_select: "p-1 pe-2 opacity-50 hover:opacity-100",
                root: "bg-background p-3",
                vhidden: "hidden"
              }}
            />
          </CardContent>
          <CardFooter className="pt-0 p-4 border-t bg-muted/20">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setIsGenerateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Plan
            </Button>
          </CardFooter>
        </Card>
        
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Date navigation */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <h2 className="text-xl font-bold text-center">
                  {selectedDate && view === 'day' 
                    ? formatDisplayDate(selectedDate) 
                    : selectedDate && view === 'week'
                      ? formatWeekRange(selectedDate)
                      : 'Select a date'}
                </h2>
                
                <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => navigate('next')}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Day View */}
          {view === 'day' && (
            <>
              {/* Loading state */}
              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((index) => (
                    <Card key={index} className="overflow-hidden">
                      <Skeleton className="h-36 w-full" />
                      <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-24" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Error state */}
              {error && (
                <Card className="text-center py-8 px-4">
                  <CardContent>
                    <p className="text-destructive mb-4">Failed to load meal plan. Please try again.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['mealPlan'] })}
                    >
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Meal cards in grid */}
              {!isLoading && !error && selectedDate && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mealTypes.map((mealType) => {
                      const meal = mealPlan?.meals?.find(m => {
                        if (!m.mealType) return false;
                        const normalizedMealType = m.mealType.toLowerCase();
                        const searchMealType = mealType.toLowerCase();
                        
                        return normalizedMealType === searchMealType || 
                               normalizedMealType.includes(searchMealType) ||
                               searchMealType.includes(normalizedMealType);
                      });
                      
                      return meal ? (
                        <MealCard 
                          key={mealType} 
                          meal={meal} 
                          onRemove={handleRemoveMeal}
                          mealType={mealType}
                        />
                      ) : (
                        <EmptyMealCard 
                          key={mealType}
                          mealType={mealType}
                          selectedDate={selectedDate}
                          formatDateString={formatDateString}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Shopping list button */}
                  {mealPlan && mealPlan.meals && mealPlan.meals.length > 0 && (
                    <div className="flex justify-end mt-8">
                      <Button asChild>
                        <Link to={`/shopping-list?mealPlanId=${mealPlan.id}`}>
                          Generate Shopping List
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
          {/* Week View */}
          {view === 'week' && (
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[768px]">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weekDates.map((date, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "p-2 text-center rounded-md cursor-pointer",
                        formatDateString(date) === formatDateString(selectedDate)
                          ? "bg-primary text-primary-foreground"
                          : formatDateString(date) === formatDateString(new Date())
                            ? "bg-accent"
                            : "hover:bg-muted"
                      )}
                      onClick={() => {
                        setDate(date);
                        setSelectedDate(date);
                        setView('day');
                      }}
                    >
                      <div className="font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-sm">
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <div className="space-y-4 pt-2">
                    {mealTypes.map(mealType => (
                      <div key={mealType} className="h-20 flex items-center">
                        <span className="font-medium">{mealType}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date, dateIndex) => (
                      <div key={dateIndex} className="space-y-4">
                        {mealTypes.map((mealType, mealIndex) => (
                          <Card key={`${dateIndex}-${mealIndex}`} className="h-20 flex items-center justify-center p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-full p-1 flex flex-col items-center justify-center"
                              onClick={() => {
                                setDate(date);
                                setSelectedDate(date);
                                setView('day');
                              }}
                            >
                              <Plus className="h-4 w-4 mb-1" />
                              <span className="text-xs">{mealType}</span>
                            </Button>
                          </Card>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Generate Plan Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Meal Plan</DialogTitle>
            <DialogDescription>
              Customize your meal plan preferences below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diet" className="text-right">
                Diet
              </Label>
              <Select
                value={preferences.diet}
                onValueChange={(value) => handlePreferenceChange('diet', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select diet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="paleo">Paleo</SelectItem>
                  <SelectItem value="ketogenic">Ketogenic</SelectItem>
                  <SelectItem value="gluten-free">Gluten Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="calories" className="text-right">
                Calories
              </Label>
              <Input
                id="calories"
                type="number"
                className="col-span-3"
                value={preferences.calories}
                onChange={(e) => handlePreferenceChange('calories', Number(e.target.value))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mealCount" className="text-right">
                Meals
              </Label>
              <Select
                value={preferences.mealCount?.toString()}
                onValueChange={(value) => handlePreferenceChange('mealCount', Number(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Number of meals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meals</SelectItem>
                  <SelectItem value="4">4 meals</SelectItem>
                  <SelectItem value="5">5 meals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleGenerateMealPlan}
              disabled={generateMealPlanMutation.isPending}
            >
              {generateMealPlanMutation.isPending ? 'Generating...' : 'Generate Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MealPlan;