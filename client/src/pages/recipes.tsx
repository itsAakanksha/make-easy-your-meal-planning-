import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BookmarkIcon, ChefHatIcon, SearchIcon, SlidersIcon, MessageSquareTextIcon, ListFilterIcon } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// API & Services
import recipeService from '@/lib/api/recipeService'

// Utils & Types
import { cn, formatTime } from '@/lib/utils'

// Define recipe types
interface Recipe {
  id: number
  title: string
  image: string
  readyInMinutes: number
  servings: number
  diets?: string[]
}

interface Nutrient {
  name: string
  amount: number
  unit: string
}

interface SearchFilters {
  query: string
  diet?: string
  cuisines?: string[]
  excludeIngredients?: string[]
  maxReadyTime?: number
  minCalories?: number
  maxCalories?: number
}

// Dummy recipe data for development
const DUMMY_RECIPES: Recipe[] = [
  {
    id: 716429,
    title: "Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs",
    image: "https://spoonacular.com/recipeImages/716429-556x370.jpg",
    readyInMinutes: 45,
    servings: 2,
    diets: ["dairy free", "lacto ovo vegetarian", "vegan"]
  },
  {
    id: 715538,
    title: "What to make for dinner tonight?? Bruschetta Style Pork & Pasta",
    image: "https://spoonacular.com/recipeImages/715538-556x370.jpg",
    readyInMinutes: 35,
    servings: 4,
    diets: []
  },
  {
    id: 715421,
    title: "Cheesy Chicken Enchilada Quinoa Casserole",
    image: "https://spoonacular.com/recipeImages/715421-556x370.jpg",
    readyInMinutes: 30,
    servings: 4,
    diets: ["gluten free"]
  },
  {
    id: 716432,
    title: "Finger Foods: Frittata Muffins",
    image: "https://spoonacular.com/recipeImages/716432-556x370.jpg",
    readyInMinutes: 45,
    servings: 2,
    diets: ["gluten free", "lacto ovo vegetarian", "primal"]
  },
  {
    id: 644387,
    title: "Garlicky Kale",
    image: "https://spoonacular.com/recipeImages/644387-556x370.jpg",
    readyInMinutes: 45,
    servings: 2,
    diets: ["dairy free", "gluten free", "lacto ovo vegetarian", "vegan"]
  },
  {
    id: 716437,
    title: "Chilled Cucumber Avocado Soup with Yogurt and Kefir",
    image: "https://spoonacular.com/recipeImages/716437-556x370.jpg",
    readyInMinutes: 45,
    servings: 2,
    diets: ["gluten free", "lacto ovo vegetarian", "primal"]
  },
  {
    id: 639535,
    title: "Citrusy Pecan Garbanzo Couscous: A Salad For Cold Weather",
    image: "https://spoonacular.com/recipeImages/639535-556x370.jpg",
    readyInMinutes: 45,
    servings: 2,
    diets: ["dairy free", "lacto ovo vegetarian", "vegan"]
  },
  {
    id: 716276,
    title: "Doughnuts",
    image: "https://spoonacular.com/recipeImages/716276-556x370.jpg",
    readyInMinutes: 45,
    servings: 2,
    diets: ["dairy free", "lacto ovo vegetarian", "vegan"]
  },
  {
    id: 716406,
    title: "Asparagus and Pea Soup: Real Convenience Food",
    image: "https://spoonacular.com/recipeImages/716406-556x370.jpg",
    readyInMinutes: 30,
    servings: 2,
    diets: ["dairy free", "gluten free", "lacto ovo vegetarian", "vegan"]
  },
  {
    id: 644488,
    title: "Herb chicken with sweet potato mash and sautéed broccoli",
    image: "https://spoonacular.com/recipeImages/644488-556x370.jpg",
    readyInMinutes: 45,
    servings: 4,
    diets: ["gluten free"]
  },
  {
    id: 715446,
    title: "Slow Cooker Beef Stew",
    image: "https://spoonacular.com/recipeImages/715446-556x370.jpg",
    readyInMinutes: 490,
    servings: 6,
    diets: ["dairy free", "gluten free"]
  },
  {
    id: 782601,
    title: "Red Kidney Bean Jambalaya",
    image: "https://spoonacular.com/recipeImages/782601-556x370.jpg",
    readyInMinutes: 45,
    servings: 6,
    diets: ["dairy free", "gluten free", "lacto ovo vegetarian", "vegan"]
  }
];

// Function to filter dummy recipes based on search criteria
const filterDummyRecipes = (filters: SearchFilters): Recipe[] => {
  let results = [...DUMMY_RECIPES];
  
  // Filter by search query (title)
  if (filters.query) {
    const query = filters.query.toLowerCase();
    results = results.filter(recipe => 
      recipe.title.toLowerCase().includes(query)
    );
  }
  
  // Filter by diet
  if (filters.diet) {
    results = results.filter(recipe => 
      recipe.diets?.includes(filters.diet || '')
    );
  }
  
  // Filter by cooking time
  if (filters.maxReadyTime) {
    results = results.filter(recipe => 
      recipe.readyInMinutes <= filters.maxReadyTime!
    );
  }
  
  // Filter by cuisines
  if (filters.cuisines && filters.cuisines.length > 0) {
    // In our dummy data we don't have cuisine info, so this would be implemented 
    // with real data. This is just a placeholder for now.
  }
  
  return results;
};

// Function to fetch popular or recommended recipes
const fetchInitialRecipes = async () => {
  // For development with dummy data
  return { 
    recipes: DUMMY_RECIPES, 
    total: DUMMY_RECIPES.length, 
    success: true 
  };
  
  // For production with real API (commented out for now)
  // try {
  //   return await recipeService.getPopularRecipes(12);
  // } catch (error) {
  //   console.error('Error fetching initial recipes:', error);
  //   return { recipes: [], total: 0, success: false };
  // }
};

const Recipes = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    maxReadyTime: 60,
    minCalories: 0,
    maxCalories: 1200
  })
  
  // New state for search mode (standard or natural language)
  const [searchMode, setSearchMode] = useState<'standard' | 'natural'>('standard')
  
  // State to control whether to use dummy data
  const [useDummyData, setUseDummyData] = useState(true)

  // Query to fetch initial/popular recipes when page loads
  const { 
    data: initialRecipesData, 
    isLoading: initialRecipesLoading 
  } = useQuery({
    queryKey: ['initialRecipes'],
    queryFn: fetchInitialRecipes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Available diet options
  const dietOptions = [
    { value: '', label: 'Any' },
    { value: 'gluten free', label: 'Gluten Free' },
    { value: 'ketogenic', label: 'Ketogenic' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'whole30', label: 'Whole30' }
  ]

  // Cuisine options
  const cuisineOptions = [
    'African', 'American', 'British', 'Caribbean', 'Chinese', 'Eastern European', 
    'French', 'Greek', 'Indian', 'Irish', 'Italian', 'Japanese', 'Korean', 
    'Latin American', 'Mediterranean', 'Mexican', 'Middle Eastern', 'Nordic', 
    'Spanish', 'Thai', 'Vietnamese'
  ]

  // Handle search input
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search term");
      return;
    }
    
    // Update filters with current search query
    setFilters(prev => ({ ...prev, query: searchQuery }))
  }

  // Handle search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Handle clicking example queries in natural language mode
  const handleExampleQueryClick = (query: string) => {
    setSearchQuery(query);
    // Auto-search when clicking an example
    setFilters(prev => ({ ...prev, query }));
  }

  // Query to fetch recipes
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recipes', filters, searchMode],
    queryFn: async () => {
      // Only send the request if there's a query
      if (!filters.query) {
        return { recipes: [], total: 0, success: true }
      }
      
      try {
        // Use dummy data if flag is set - FOR DEVELOPMENT ONLY
        if (useDummyData) {
          console.log(`Using dummy data for ${searchMode} search with query: "${filters.query}"`);
          // Simulate network delay for realistic experience
          await new Promise(resolve => setTimeout(resolve, 500));
          const filteredRecipes = filterDummyRecipes(filters);
          return { 
            recipes: filteredRecipes, 
            total: filteredRecipes.length, 
            success: true,
            originalQuery: filters.query 
          };
        }

        // For production - use the appropriate search method based on mode
        if (searchMode === 'natural') {
          console.log(`Performing natural language search with query: "${filters.query}"`);
          // Natural language search
          return await recipeService.searchRecipesNaturalLanguage(filters.query);
        } else {
          console.log(`Performing standard search with query: "${filters.query}"`);
          // Standard search with filters
          return await recipeService.searchRecipes({
            query: filters.query,
            diet: filters.diet,
            maxReadyTime: filters.maxReadyTime,
            minCalories: filters.minCalories,
            maxCalories: filters.maxCalories,
            cuisines: filters.cuisines,
            excludeIngredients: filters.excludeIngredients
          });
        }
      } catch (error) {
        console.error(`Error fetching recipes with ${searchMode} search:`, error);
        throw new Error(`Failed to search recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    enabled: Boolean(filters.query),
    retry: 1, // Only retry once on failure
  })

  // Handle saving a recipe
  const handleSaveRecipe = (recipe: Recipe) => {
    // This would call an API to save the recipe to the user's account
    toast.success(`Recipe "${recipe.title}" saved to your collection!`)
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <p className="text-muted-foreground">Search for recipes or browse by category</p>
        
        {/* Search mode tabs */}
        <Tabs 
          defaultValue="standard" 
          value={searchMode}
          onValueChange={(value) => setSearchMode(value as 'standard' | 'natural')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="standard" className="flex items-center gap-2">
              <ListFilterIcon className="h-4 w-4" />
              Standard Search
            </TabsTrigger>
            <TabsTrigger value="natural" className="flex items-center gap-2">
              <MessageSquareTextIcon className="h-4 w-4" />
              Natural Language
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard">
            {/* Standard search UI */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes by name, ingredients, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                />
              </div>
              
              <Button onClick={handleSearch} variant="default">
                Search
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersIcon className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Recipe Filters</SheetTitle>
                    <SheetDescription>
                      Refine your recipe search with these filters
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-6 space-y-6">
                    {/* Diet filter */}
                    <div className="space-y-2">
                      <Label htmlFor="diet">Diet</Label>
                      <Select 
                        value={filters.diet || ''}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, diet: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a diet" />
                        </SelectTrigger>
                        <SelectContent>
                          {dietOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    {/* Max cooking time filter */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="cooking-time">Max Cooking Time</Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.maxReadyTime} minutes
                        </span>
                      </div>
                      <Slider
                        id="cooking-time"
                        min={10}
                        max={120}
                        step={5}
                        value={[filters.maxReadyTime || 60]}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, maxReadyTime: value[0] }))}
                      />
                    </div>
                    
                    <Separator />
                    
                    {/* Calorie range filter */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="calories">Calorie Range</Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.minCalories} - {filters.maxCalories} kcal
                        </span>
                      </div>
                      <div className="pt-4">
                        <Slider
                          id="calories"
                          min={0}
                          max={2000}
                          step={50}
                          value={[filters.minCalories || 0, filters.maxCalories || 1200]}
                          onValueChange={(value) => setFilters(prev => ({ 
                            ...prev, 
                            minCalories: value[0], 
                            maxCalories: value[1]
                          }))}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Cuisine filters (checkboxes) */}
                    <div className="space-y-2">
                      <Label>Cuisines</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {cuisineOptions.map(cuisine => (
                          <div key={cuisine} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`cuisine-${cuisine}`}
                              checked={filters.cuisines?.includes(cuisine)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    cuisines: [...(prev.cuisines || []), cuisine]
                                  }))
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    cuisines: prev.cuisines?.filter(c => c !== cuisine)
                                  }))
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`cuisine-${cuisine}`}
                              className="text-sm font-normal"
                            >
                              {cuisine}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 space-x-2">
                      <Button onClick={handleSearch} className="w-full">
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </TabsContent>
          
          <TabsContent value="natural">
            {/* Natural language search UI */}
            <div className="flex flex-col space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquareTextIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Natural Language Search</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Describe what you're looking for in everyday language - for example:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => handleExampleQueryClick("healthy dinner for family with kids")}>
                      healthy dinner for family with kids
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => handleExampleQueryClick("quick vegetarian lunch under 500 calories")}>
                      quick vegetarian lunch under 500 calories
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => handleExampleQueryClick("something with chicken and spinach")}>
                      something with chicken and spinach
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => handleExampleQueryClick("easy weeknight dinner that's gluten-free")}>
                      easy weeknight dinner that's gluten-free
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <MessageSquareTextIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="I'm looking for something..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                  />
                </div>
                
                <Button 
                  onClick={handleSearch} 
                  variant="default"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Recipe Results */}
      <div>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Searching for recipes...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">
            <p>Error loading recipes. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Show results count when searching */}
            {filters.query && (
              <div className="mb-4">
                <p className="text-muted-foreground">
                  {data?.recipes?.length 
                    ? `Found ${data.recipes.length} recipes for "${filters.query}"`
                    : `No recipes found for "${filters.query}"`
                  }
                </p>
              </div>
            )}
            
            {/* Recipe grid - Show search results if available */}
            {data?.recipes?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.recipes.map((recipe: Recipe) => (
                  <Card key={recipe.id} className="overflow-hidden flex flex-col h-full">
                    <div 
                      className="h-48 bg-cover bg-center" 
                      style={{ 
                        backgroundImage: `url(${recipe.image})` 
                      }}
                    />
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span>Ready in {recipe.readyInMinutes} min</span>
                        <span>Serves {recipe.servings}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {recipe.diets?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recipe.diets.slice(0, 3).map(diet => (
                            <Badge key={diet} variant="outline">
                              {diet}
                            </Badge>
                          ))}
                          {recipe.diets.length > 3 && (
                            <Badge variant="outline">+{recipe.diets.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="default" 
                        onClick={() => navigate(`/recipes/${recipe.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleSaveRecipe(recipe)}
                      >
                        <BookmarkIcon className="h-5 w-5" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Display initial recipes when no search performed */}
            {!filters.query && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Popular Recipes</h2>
                  <p className="text-muted-foreground">
                    Explore our most popular recipes or use the search to find something specific
                  </p>
                </div>
                
                {initialRecipesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading recipes...</p>
                  </div>
                ) : initialRecipesData?.recipes?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialRecipesData.recipes.map((recipe: Recipe) => (
                      <Card key={recipe.id} className="overflow-hidden flex flex-col h-full">
                        <div 
                          className="h-48 bg-cover bg-center" 
                          style={{ 
                            backgroundImage: `url(${recipe.image})` 
                          }}
                        />
                        <CardHeader className="pb-2">
                          <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span>Ready in {recipe.readyInMinutes} min</span>
                            <span>Serves {recipe.servings}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          {recipe.diets?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {recipe.diets.slice(0, 3).map(diet => (
                                <Badge key={diet} variant="outline">
                                  {diet}
                                </Badge>
                              ))}
                              {recipe.diets.length > 3 && (
                                <Badge variant="outline">+{recipe.diets.length - 3} more</Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button 
                            variant="default" 
                            onClick={() => navigate(`/recipes/${recipe.id}`)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleSaveRecipe(recipe)}
                          >
                            <BookmarkIcon className="h-5 w-5" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <ChefHatIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-medium">No recipes available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Try searching for recipes or check back later for our recommendations
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Recipes