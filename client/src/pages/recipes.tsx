// filepath: e:\goldi\Projects\ai_meal_planner\client\src\pages\recipes.tsx
import { useState, useEffect } from 'react';
import { useApiClient } from '../lib/api/client';
import { Link, useLocation } from 'wouter';
import { ChefHat, Search, Plus, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { RecipeCard } from '../components/recipe-card';
import { Recipe } from '@/lib/spoonacular';

export default function RecipesPage() {
  const apiClient = useApiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [, navigate] = useLocation();

  // Fetch saved recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSavedRecipes();
        
        if (response.success && response.recipes) {
          setRecipes(response.recipes);
          setFilteredRecipes(response.recipes);
        } else {
          console.error('Failed to fetch recipes:', response);
          toast.error('Failed to load recipes');
          
          // Fallback to empty array if no recipes found
          setRecipes([]);
          setFilteredRecipes([]);
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
        toast.error('Failed to load recipes');
        setRecipes([]);
        setFilteredRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [apiClient]);

  // Filter recipes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(query)
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            My Recipes
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage your saved recipes
          </p>
        </div>

        <Link href="/recipe/new">
          <Button className="flex items-center gap-2">
            <Plus size={18} />
            Add Recipe
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search recipes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden h-[300px] animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map(recipe => {
            // Convert the recipe data format to match what RecipeCard expects
            const recipeForCard: Recipe = {
              id: recipe.id,
              title: recipe.title,
              image: recipe.image || '',
              readyInMinutes: recipe.readyInMinutes || 0,
              servings: recipe.servings || 0,
              instructions: '',
              nutrition: { nutrients: [] }
            };
            
            return (
              <div key={recipe.id}>
                <RecipeCard 
                  {...recipeForCard}
                  isSaved={true}
                  onClick={() => {
                    // Use proper routing instead of direct window location
                    navigate(`/recipe/${recipe.id}`);
                  }}
                  onSaveToggle={async () => {
                    try {
                      await apiClient.unsaveRecipe(recipe.id.toString());
                      toast.success("Recipe removed from saved recipes");
                      
                      // Refresh the recipes list
                      setRecipes(prev => prev.filter(r => r.id !== recipe.id));
                      setFilteredRecipes(prev => prev.filter(r => r.id !== recipe.id));
                    } catch (error) {
                      console.error("Error removing recipe:", error);
                      toast.error("Failed to remove recipe. Please try again.");
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-muted/30 p-4 rounded-full mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No recipes found</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {searchQuery ? 
              `No recipes matching "${searchQuery}"` : 
              "You haven't saved any recipes yet"}
          </p>
          <Link href="/recipe/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Recipe
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}