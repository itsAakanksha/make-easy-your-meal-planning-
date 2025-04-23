// filepath: e:\goldi\Projects\ai_meal_planner\client\src\pages\shopping-list.tsx
import { useState, useEffect } from 'react';
import { useApiClient } from '../lib/api/client';
import { ShoppingList as ShoppingListComponent } from '../components/shopping-list/shopping-list';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface MealPlan {
  id: number;
  date: string;
  name?: string;
}

export default function ShoppingListPage() {
  const apiClient = useApiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Fetch meal plans to get their IDs for shopping lists
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMealPlans();
        
        if (response.success && response.mealPlans) {
          setMealPlans(response.mealPlans);
          
          // If we have meal plans, select the most recent one
          if (response.mealPlans.length > 0) {
            setSelectedPlanId(response.mealPlans[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        toast.error('Failed to load meal plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealPlans();
  }, [apiClient]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Shopping List
          </h1>
          <p className="text-muted-foreground mt-1">
            Track ingredients you need for your meal plans
          </p>
        </div>

        {mealPlans.length > 0 && !isLoading && (
          <select
            value={selectedPlanId?.toString() || ""}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {mealPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name || new Date(plan.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Shopping List Component */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading shopping list...</p>
        </div>
      ) : mealPlans.length === 0 ? (
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border/50 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Meal Plans Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You need to create a meal plan before generating a shopping list.
          </p>
          <a 
            href="/meal-plan" 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Create Meal Plan
          </a>
        </div>
      ) : selectedPlanId ? (
        <ShoppingListComponent mealPlanId={selectedPlanId} />
      ) : null}
    </div>
  );
}