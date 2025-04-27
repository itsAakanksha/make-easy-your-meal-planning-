import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BookmarkIcon, ChefHatIcon, SearchIcon, SlidersIcon } from 'lucide-react'

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

const Recipes = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    maxReadyTime: 60,
    minCalories: 0,
    maxCalories: 1200
  })

  // Available diet options
  const dietOptions = [
    { value: '', label: 'Any' },
    { value: 'gluten-free', label: 'Gluten Free' },
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
    // Update filters with current search query
    setFilters(prev => ({ ...prev, query: searchQuery }))
  }

  // Handle search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Query to fetch recipes
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      // Only send the request if there's a query
      if (!filters.query) {
        return { results: [] }
      }

      // Build query parameters for API request
      const params = new URLSearchParams()
      
      // Add all filters to params
      if (filters.query) params.append('query', filters.query)
      if (filters.diet) params.append('diet', filters.diet)
      if (filters.maxReadyTime) params.append('maxReadyTime', filters.maxReadyTime.toString())
      if (filters.minCalories) params.append('minCalories', filters.minCalories.toString())
      if (filters.maxCalories) params.append('maxCalories', filters.maxCalories.toString())
      
      // Add cuisine filters if any are selected
      if (filters.cuisines && filters.cuisines.length > 0) {
        filters.cuisines.forEach(cuisine => params.append('cuisines', cuisine))
      }
      
      // Add excluded ingredients if any
      if (filters.excludeIngredients && filters.excludeIngredients.length > 0) {
        filters.excludeIngredients.forEach(ingredient => params.append('excludeIngredients', ingredient))
      }
      
      try {
        const response = await axios.get(`/api/recipes/search?${params.toString()}`)
        return response.data
      } catch (error) {
        console.error('Error fetching recipes:', error)
        throw new Error('Failed to fetch recipes')
      }
    },
    enabled: Boolean(filters.query),
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
        
        {/* Search and filter bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
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
            {/* Show results count */}
            {filters.query && (
              <div className="mb-4">
                <p className="text-muted-foreground">
                  {data?.results?.length 
                    ? `Found ${data.results.length} recipes for "${filters.query}"`
                    : `No recipes found for "${filters.query}"`
                  }
                </p>
              </div>
            )}
            
            {/* Empty state */}
            {!filters.query && (
              <div className="text-center py-16 space-y-4">
                <ChefHatIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-medium">Search for recipes</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enter ingredients, dish names, or dietary preferences to find the perfect recipe
                </p>
              </div>
            )}
            
            {/* Recipe grid */}
            {data?.results?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.results.map((recipe: Recipe) => (
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
          </>
        )}
      </div>
    </div>
  )
}

export default Recipes