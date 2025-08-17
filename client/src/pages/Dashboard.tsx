import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth.tsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { CalendarDays, ChefHat, Sparkles, ShoppingCart, ArrowRight } from 'lucide-react'
import { formatDate } from '../lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../components/ui/skeleton'
import { useApiClient } from '@/lib/api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState('Good day')
  const apiClient = useApiClient()
  const today = new Date()
  const formattedToday = formatDate(today.toString())
  
  // Format date to string (YYYY-MM-DD) - ensuring consistency with meal plan component
  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Fetch today's meal plan directly using the same endpoint as the MealPlan component
  const { data: todaysMealPlanData, isLoading: isMealPlansLoading } = useQuery({
    queryKey: ['mealPlan', formatDateString(today)],
    queryFn: async () => {
      const dateStr = formatDateString(today);
      console.log("Dashboard - Fetching meal plans for today:", dateStr);
      
      // Use the same endpoint that works in the MealPlan component
      const response = await apiClient.get<{ success: boolean, date: string, mealPlans?: any[] }>(`/mealplans/date/${dateStr}`);
      console.log("Dashboard - Got response for today's meal plan:", response);
      
      if (response.success && response.mealPlans && response.mealPlans.length > 0) {
        // Take the most recent meal plan if multiple exist
        const mostRecentPlan = response.mealPlans.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        console.log("Dashboard - Found meal plan for today:", mostRecentPlan);
        
        // Check if we have meals in the meals property or mealsForRequestedDate property
        let mealsArray = [];
        
        if (mostRecentPlan.meals && mostRecentPlan.meals.length > 0) {
          mealsArray = mostRecentPlan.meals;
        } else if (mostRecentPlan.mealsForRequestedDate && mostRecentPlan.mealsForRequestedDate.length > 0) {
          mealsArray = mostRecentPlan.mealsForRequestedDate;
        }
        
        return {
          id: mostRecentPlan.id,
          date: dateStr,
          meals: mealsArray
        };
      }
      
      // If no meal plan exists for today, return a default structure
      return {
        id: 0,
        date: dateStr,
        meals: []
      };
    }
  });

  type DisplayMeal = {
    id: string;
    type: string;
    title: string;
    imageUrl: string;
    prepTime: number;
    calories: number;
  };
  
  // Format meals for display
    const todaysMeals: DisplayMeal[] = todaysMealPlanData?.meals?.map((meal: { id: number; mealType: string; title: string; imageUrl?: string; readyInMinutes?: number }) => ({
      id: meal.id.toString(),
      type: meal.mealType,
      title: meal.title,
      imageUrl: meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      prepTime: meal.readyInMinutes || 0,
      calories: 0 // We'll need to fetch this separately if needed
    })) || [];
  
  // Update greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])
  
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {user?.firstName || 'there'} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your meal plan for today, {formattedToday}
          </p>
        </div>
        
        {isMealPlansLoading ? (
          // Loading state
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video w-full">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardHeader className="py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </CardHeader>
                <CardFooter className="justify-between border-t p-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : todaysMeals.length > 0 ? (
          // Meal plan exists for today
          <div className="grid gap-4 md:grid-cols-3">
            {todaysMeals.map((meal) => (
              <Card key={meal.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={meal.imageUrl} 
                    alt={meal.title} 
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader className="py-3">
                  <CardTitle className="capitalize text-lg">
                    {meal.type}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {meal.title}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-between border-t p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ChefHat size={12} />
                    <span>{meal.prepTime} mins</span>
                  </div>
                  <div>~{meal.calories} kcal</div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          // No meal plan for today
          <Card className="p-6 text-center">
            <p className="mb-4 text-muted-foreground">You don't have a meal plan for today.</p>
            <Button asChild>
              <Link to="/meal-plan">Create a Meal Plan</Link>
            </Button>
          </Card>
        )}
        
        {todaysMeals.length > 0 && (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link to="/meal-plan" className="flex items-center gap-1">
                View full meal plan
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        )}
      </section>

      <section>
        <Tabs defaultValue="actions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="stats">Your Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="actions" className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Generate Meal Plan</CardTitle>
                  <Sparkles size={20} className="text-primary" />
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Create a custom meal plan based on your preferences and dietary needs.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to="/meal-plan">Create Plan</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Browse Recipes</CardTitle>
                  <ChefHat size={20} className="text-primary" />
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Discover new recipes tailored to your taste preferences.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/recipes">Find Recipes</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Shopping List</CardTitle>
                  <ShoppingCart size={20} className="text-primary" />
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Generate a shopping list based on your current meal plan.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/shopping-list">View List</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Summary</CardTitle>
                <CardDescription>Your average daily nutritional intake this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                      <span>Protein</span>
                    </div>
                    <span className="font-medium">82g</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[65%] rounded-full bg-primary"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span>Carbs</span>
                    </div>
                    <span className="font-medium">220g</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[75%] rounded-full bg-blue-500"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                      <span>Fats</span>
                    </div>
                    <span className="font-medium">58g</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[45%] rounded-full bg-amber-500"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Calories</span>
                    </div>
                    <span className="font-medium">1,820 kcal</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 w-[70%] rounded-full bg-green-500"></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link to="/preferences" className="flex items-center gap-1">
                    <CalendarDays size={16} />
                    View Full History
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}