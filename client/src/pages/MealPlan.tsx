import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/client';
import { useSearchParams } from 'react-router-dom';

// Define meal plan types
interface Meal {
  id: number;
  recipeId: number;
  title: string;
  imageUrl?: string;
  mealType: string;
  readyInMinutes?: number;
  servings?: number;
}

interface MealPlan {
  id: number;
  date: string;
  meals: Meal[];
}

const MealPlan = () => {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const apiClient = useApiClient();
  
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
        const response = await apiClient.get<{success: boolean, mealPlan: MealPlan}>(`/meal-plans/date/${dateStr}`);
        
        if (response.success && response.mealPlan) {
          return response.mealPlan;
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

  // Navigate to previous/next day
  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
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

  // Create new meal plan
  const handleCreateMealPlan = async () => {
    if (!selectedDate) return;
    
    try {
      // This would typically make an API call to create a new meal plan
      console.log('Creating meal plan for:', formatDateString(selectedDate));
      
      // Show success message
      alert('Meal plan created successfully!');
    } catch (error) {
      console.error('Error creating meal plan:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Calendar sidebar */}
        <div className="w-full md:w-80">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                Select a date to view or plan meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                    setSelectedDate(date);
                  }
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Date navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" size="icon" onClick={() => navigateDay('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-2xl font-bold">
              {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
            </h2>
            
            <Button variant="outline" size="icon" onClick={() => navigateDay('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Add meal button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {mealPlan && mealPlan.meals.length > 0
                ? `${mealPlan.meals.length} meals planned`
                : 'No meals planned yet'}
            </h3>
            
            <Button onClick={handleCreateMealPlan}>
              <Plus className="mr-2 h-4 w-4" />
              Create Meal Plan
            </Button>
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading meal plan...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="text-center py-16 text-destructive">
              <p>Failed to load meal plan. Please try again.</p>
            </div>
          )}
          
          {/* Meal slots */}
          {!isLoading && !error && selectedDate && (
            <div className="space-y-4">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((mealType) => {
                const meal = mealPlan?.meals.find(m => m.mealType.toLowerCase() === mealType.toLowerCase());
                
                return (
                  <Card key={mealType} className={`${meal ? 'bg-card' : 'bg-muted/50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{mealType}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {meal ? (
                        <div className="flex items-center space-x-4">
                          {meal.imageUrl && (
                            <img
                              src={meal.imageUrl}
                              alt={meal.title}
                              className="h-20 w-20 rounded-md object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{meal.title}</h4>
                            {meal.readyInMinutes && <p className="text-sm text-muted-foreground">Ready in {meal.readyInMinutes} min</p>}
                            {meal.servings && <p className="text-sm text-muted-foreground">Serves {meal.servings}</p>}
                          </div>
                        </div>
                      ) : (
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                          <Plus className="mr-2 h-4 w-4" />
                          Add {mealType}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealPlan;