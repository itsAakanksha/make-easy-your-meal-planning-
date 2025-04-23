import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useApiClient } from '../lib/api/client';
import { format, parseISO } from 'date-fns';
import { useUser } from '@clerk/clerk-react';
import { CalendarRange, ChefHat, User2 } from 'lucide-react';
import { toast } from 'sonner';

interface MealPlan {
  id: number;
  date: string;
  name?: string;
  description?: string;
  meals: any[];
}

interface UserProfile {
  name?: string;
  diet?: string;
  allergies?: string[];
  calorieTarget?: number;
  cuisinePreferences?: string[];
  goalType?: string;
  budgetPerMeal?: number;
  cookingTime?: number;
}

export default function Home() {
  const [, navigate] = useLocation();
  const apiClient = useApiClient();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [recentMealPlans, setRecentMealPlans] = useState<MealPlan[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [todaysPlan, setTodaysPlan] = useState<MealPlan | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Fetch user data and meal plans on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setGenerationError(null);
        
        // Fetch user profile
        const profileResponse = await apiClient.getUserProfile();
        if (profileResponse.success && profileResponse.profile) {
          setUserProfile(profileResponse.profile);
        }
        
        // Fetch meal plans
        const mealPlansResponse = await apiClient.getMealPlans();
        if (mealPlansResponse.success && mealPlansResponse.mealPlans) {
          const plans = mealPlansResponse.mealPlans;
          setRecentMealPlans(plans);
          
          // Find today's meal plan if it exists
          const today = format(new Date(), 'yyyy-MM-dd');
          const todayPlan = plans.find((plan: MealPlan) => plan.date === today);
          if (todayPlan) {
            setTodaysPlan(todayPlan);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load your data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiClient]);

  // Modified quick action handlers with error handling
  const handleGeneratePlan = async () => {
    // For direct generation from home page, add error handling
    if (!userProfile) {
      toast.error('Please set your preferences before generating a meal plan');
      navigate('/meal-plan?tab=preferences');
      return;
    }
    
    try {
      setIsLoading(true);
      setGenerationError(null);
      
      // Attempt to generate a meal plan - you could add direct API call here
      // or just navigate to the generation page
      navigate('/meal-plan?tab=generate');
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      setGenerationError(error?.message || 'Failed to generate meal plan');
      toast.error('There was a problem generating your meal plan');
      navigate('/meal-plan?tab=generate&error=true');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPlans = () => {
    navigate('/meal-plan?tab=view');
  };

  const handleUpdatePreferences = () => {
    navigate('/meal-plan?tab=preferences');
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Welcome Banner */}
      <div className="mb-10 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {userProfile?.name || user?.firstName || 'Chef'}!
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Your AI-powered meal planning assistant is here to help you create personalized, 
          nutritious meal plans tailored to your preferences and dietary needs.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div 
          onClick={handleGeneratePlan}
          className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-semibold">Generate Meal Plan</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Create a new personalized meal plan based on your preferences.
          </p>
        </div>

        <div 
          onClick={handleViewPlans}
          className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <CalendarRange className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-semibold">View Meal Plans</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Browse your saved meal plans and recipes.
          </p>
        </div>

        <div 
          onClick={handleUpdatePreferences}
          className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <User2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-semibold">Update Preferences</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Customize your dietary preferences and nutritional goals.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Meals Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Today's Meals</h2>
            {todaysPlan && (
              <Link 
                to={`/meal-plan?id=${todaysPlan.id}`}
                className="text-primary text-sm hover:underline"
              >
                View Full Plan
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse h-48 rounded-xl" />
              ))}
            </div>
          ) : todaysPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const meal = todaysPlan.meals.find(m => m.mealType === mealType);
                
                return (
                  <div key={mealType} className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
                    {meal ? (
                      <>
                        <div className="aspect-[4/3] bg-muted relative">
                          {meal.imageUrl ? (
                            <img 
                              src={meal.imageUrl} 
                              alt={meal.title} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-muted-foreground">No image</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground px-2 py-1 rounded text-xs font-medium capitalize">
                            {mealType}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-base mb-1 truncate">{meal.title}</h3>
                          <Link 
                            to={`/recipe/${meal.recipeId}`}
                            className="text-primary text-sm hover:underline"
                          >
                            View Recipe
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-muted-foreground capitalize mb-2">{mealType}</div>
                        <p className="text-sm text-muted-foreground mb-4">No meal planned</p>
                        <button 
                          onClick={handleGeneratePlan}
                          className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                        >
                          Generate Plan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border/50 flex flex-col items-center justify-center text-center">
              <CalendarRange className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Meal Plan for Today</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                You don't have a meal plan for today. Generate a new plan to get started.
              </p>
              <button 
                onClick={handleGeneratePlan}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Generate Meal Plan
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Recent Plans */}
        <div className="space-y-8">
          {/* User Profile Summary */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h2 className="text-xl font-bold mb-4">Your Profile</h2>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse h-6 rounded-md" />
                ))}
              </div>
            ) : userProfile ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Diet Type</div>
                  <div className="font-medium capitalize">{userProfile.diet || 'Not specified'}</div>
                </div>
                
                {userProfile.goalType && (
                  <div>
                    <div className="text-sm text-muted-foreground">Goal</div>
                    <div className="font-medium capitalize">{userProfile.goalType.replace(/-/g, ' ')}</div>
                  </div>
                )}
                
                {userProfile.allergies && userProfile.allergies.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Allergies</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userProfile.allergies.map(allergy => (
                        <span 
                          key={allergy} 
                          className="px-2 py-0.5 bg-muted text-xs rounded-full capitalize"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {userProfile.cuisinePreferences && userProfile.cuisinePreferences.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Preferred Cuisines</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userProfile.cuisinePreferences.map(cuisine => (
                        <span 
                          key={cuisine} 
                          className="px-2 py-0.5 bg-muted text-xs rounded-full capitalize"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {userProfile.calorieTarget && (
                  <div>
                    <div className="text-sm text-muted-foreground">Daily Calorie Target</div>
                    <div className="font-medium">{userProfile.calorieTarget} calories</div>
                  </div>
                )}
                
                {userProfile.budgetPerMeal && (
                  <div>
                    <div className="text-sm text-muted-foreground">Budget per Meal</div>
                    <div className="font-medium">${(userProfile.budgetPerMeal / 100).toFixed(2)}</div>
                  </div>
                )}
                
                {userProfile.cookingTime && (
                  <div>
                    <div className="text-sm text-muted-foreground">Max Cooking Time</div>
                    <div className="font-medium">{userProfile.cookingTime} minutes</div>
                  </div>
                )}
                
                <button 
                  onClick={handleUpdatePreferences}
                  className="text-primary text-sm hover:underline"
                >
                  Update Preferences
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Complete your profile to get personalized meal plans.
                </p>
                <button 
                  onClick={handleUpdatePreferences}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Set Preferences
                </button>
              </div>
            )}
          </div>

          {/* Recent Meal Plans */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <h2 className="text-xl font-bold mb-4">Recent Plans</h2>
            
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse h-12 rounded-md" />
                ))}
              </div>
            ) : recentMealPlans.length > 0 ? (
              <div className="space-y-2">
                {recentMealPlans.slice(0, 5).map(plan => (
                  <Link 
                    key={plan.id} 
                    to={`/meal-plan?id=${plan.id}`}
                    className="block p-3 hover:bg-muted rounded-md transition-colors"
                  >
                    <div className="font-medium">
                      {plan.name || format(parseISO(plan.date), 'MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.meals.length} {plan.meals.length === 1 ? 'meal' : 'meals'}
                    </div>
                  </Link>
                ))}
                
                <div className="pt-2">
                  <Link 
                    to="/meal-plan?tab=view"
                    className="text-primary text-sm hover:underline"
                  >
                    View All Plans
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You haven't created any meal plans yet.
                </p>
                <button 
                  onClick={handleGeneratePlan}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Create Your First Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}