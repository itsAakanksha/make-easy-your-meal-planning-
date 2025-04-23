import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApiClient } from '../lib/api/client';
import { toast } from 'sonner';
import { MealPlanGenerator } from '../components/meal-plan-generator';
import { MealPlanDisplay } from '../components/meal-plan-display';
import { PreferencesForm } from '../components/preferences/preferences-form';
import { ShoppingListModal } from '../components/shopping-list/shopping-list-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function MealPlan() {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const mealPlanId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState<string>(mealPlanId ? 'view' : 'preferences');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<number | null>(
    mealPlanId ? parseInt(mealPlanId) : null
  );
  const apiClient = useApiClient();
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);

  // Fetch meal plan data when the component mounts or when the activeTab changes to 'view'
  useEffect(() => {
    if (activeTab === 'view' && selectedMealPlanId) {
      fetchMealPlan(selectedMealPlanId);
    }
  }, [activeTab, selectedMealPlanId]);

  // Fetch meal plan data when the URL has an ID parameter
  useEffect(() => {
    if (mealPlanId) {
      const id = parseInt(mealPlanId);
      setSelectedMealPlanId(id);
      fetchMealPlan(id);
    }
  }, [mealPlanId]);

  const fetchMealPlan = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getMealPlanById(id);
      
      if (response.success && response.mealPlan) {
        // Transform the meal plan data into the structure expected by MealPlanDisplay
        const mealPlanData = response.mealPlan;
        
        // Group meals by date to create the days array
        const mealsGroupedByDate = {};
        
        if (mealPlanData.meals && mealPlanData.meals.length > 0) {
          mealPlanData.meals.forEach(meal => {
            // Use the mealPlan date if no specific date is assigned to the meal
            const mealDate = meal.date || mealPlanData.date;
            
            if (!mealsGroupedByDate[mealDate]) {
              mealsGroupedByDate[mealDate] = [];
            }
            
            // Transform meal data to match the expected structure
            mealsGroupedByDate[mealDate].push({
              id: meal.id.toString(),
              type: meal.mealType,
              recipe: {
                id: parseInt(meal.recipeId),
                title: meal.title,
                image: meal.imageUrl || 'https://placehold.co/600x400/orange/white?text=Recipe+Image',
                readyInMinutes: meal.readyInMinutes || 30,
                servings: meal.servings || 1
              }
            });
          });
        }
        
        // Create days array from grouped meals
        const days = Object.keys(mealsGroupedByDate).map(date => ({
          date,
          meals: mealsGroupedByDate[date]
        }));
        
        // Calculate end date based on the meal plan's date + days length
        const startDate = mealPlanData.date;
        let endDate = startDate;
        
        if (days.length > 1) {
          // If we have multiple days, use the last day's date as the end date
          endDate = days[days.length - 1].date;
        } else if (days.length === 0) {
          // If there are no days, use the meal plan date as both start and end
          days.push({
            date: startDate,
            meals: []
          });
        }
        
        // Create the transformed meal plan
        const transformedMealPlan = {
          id: mealPlanData.id.toString(),
          title: mealPlanData.name || "My Meal Plan",
          startDate: startDate,
          endDate: endDate,
          days: days,
          calories: 0, // Calculate these if available
          protein: 0,
          carbs: 0,
          fat: 0
        };
        
        setMealPlan(transformedMealPlan);
      } else {
        toast.error('Failed to load meal plan');
        setMealPlan(null);
      }
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      toast.error('Failed to load meal plan');
      setMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecipe = (recipeId: number) => {
    navigate(`/recipe/${recipeId}`);
  };

  const handleGenerateShoppingList = () => {
    if (selectedMealPlanId) {
      setShowShoppingList(true);
    }
  };

  // Navigate to the most recently generated meal plan when switching to view tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // If switching to view tab but no meal plan selected, try to fetch the most recent one
    if (value === 'view' && !selectedMealPlanId) {
      fetchRecentMealPlan();
    }
  };

  const fetchRecentMealPlan = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getMealPlans();
      
      if (response.success && response.mealPlans && response.mealPlans.length > 0) {
        const recentPlan = response.mealPlans[0];
        setSelectedMealPlanId(recentPlan.id);
        
        // Process the meal plan data into the correct format
        await fetchMealPlan(recentPlan.id);
      } else {
        setMealPlan(null);
      }
    } catch (error) {
      console.error('Error fetching recent meal plan:', error);
      setMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meal Planner</h1>
        <p className="text-muted-foreground">
          Create personalized meal plans based on your dietary preferences and nutritional goals.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-8">
          <TabsTrigger value="view">View Plans</TabsTrigger>
          <TabsTrigger value="generate">Generate Plan</TabsTrigger>
          <TabsTrigger value="preferences">My Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            mealPlan ? (
              <MealPlanDisplay
                id={mealPlan.id}
                title={mealPlan.title || "My Meal Plan"}
                startDate={mealPlan.startDate}
                endDate={mealPlan.endDate}
                days={mealPlan.days}
                calories={mealPlan.calories}
                protein={mealPlan.protein}
                carbs={mealPlan.carbs}
                fat={mealPlan.fat}
                onViewRecipe={handleViewRecipe}
                onGenerateShoppingList={handleGenerateShoppingList}
              />
            ) : (
              <MealPlanDisplay
                id=""
                title="My Meal Plan"
                startDate={new Date().toISOString()}
                endDate={new Date().toISOString()}
                days={[]}
                onViewRecipe={handleViewRecipe}
                onGenerateShoppingList={handleGenerateShoppingList}
              />
            )
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <MealPlanGenerator />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-card p-6 rounded-lg shadow-sm h-full">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Set Your Preferences</h3>
                      <p className="text-muted-foreground">
                        Update your dietary preferences, allergies, nutritional goals, and meal restrictions in the "My Preferences" tab.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Generate a Plan</h3>
                      <p className="text-muted-foreground">
                        Choose your start date and number of days, then click "Generate Meal Plan" to create a personalized plan.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">View Recipes & Create Shopping List</h3>
                      <p className="text-muted-foreground">
                        Browse your meal plan, view detailed recipes, and generate a shopping list for easy grocery shopping.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesForm />
        </TabsContent>
      </Tabs>

      {/* Shopping List Modal */}
      {selectedMealPlanId && (
        <ShoppingListModal
          mealPlanId={selectedMealPlanId}
          isOpen={showShoppingList}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </div>
  );
}