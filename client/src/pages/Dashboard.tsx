import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth.tsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { CalendarDays, ChefHat, Sparkles, ShoppingCart, ArrowRight } from 'lucide-react'
import { formatDate } from '../lib/utils'

// This would come from an API in a real implementation
const mockTodaysMeals = [
  {
    id: '1',
    type: 'breakfast',
    title: 'Greek Yogurt with Berries and Honey',
    imageUrl: 'https://images.unsplash.com/photo-1551240099-3b6ded39d148?w=600',
    prepTime: 5,
    calories: 320
  },
  {
    id: '2',
    type: 'lunch',
    title: 'Mediterranean Quinoa Salad',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
    prepTime: 15,
    calories: 420
  },
  {
    id: '3',
    type: 'dinner',
    title: 'Baked Salmon with Asparagus',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
    prepTime: 25,
    calories: 520
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState('Good day')
  const today = new Date()
  
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
            Here's your meal plan for today, {formatDate(today.toString())}
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {mockTodaysMeals.map((meal) => (
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
        
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link to="/meal-plan" className="flex items-center gap-1">
              View full meal plan
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
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