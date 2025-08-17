import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 

  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the preferences schema
const preferencesSchema = z.object({
  name: z.string().optional(),
  diet: z.string().optional(),
  calorieTarget: z.number().min(500).max(5000).optional(),
  proteinTarget: z.number().min(0).max(300).optional(),
  carbTarget: z.number().min(0).max(500).optional(),
  fatTarget: z.number().min(0).max(200).optional(),
  mealCount: z.number().min(1).max(6),
  cookingTime: z.number().min(10).max(180).optional(),
  servings: z.number().min(1).max(12),
  allergies: z.array(z.string()).optional(),
  dislikes: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
});

// Type for user preferences
type UserPreferences = z.infer<typeof preferencesSchema>;

// Backend response interface
interface BackendPreferencesResponse {
  id?: number;
  userId?: number;
  diet?: string | null;
  allergies?: string[] | null;
  dislikes?: string[] | null;
  cuisinePreferences?: string[] | null;
  goals?: {
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    goalType?: string;
  } | null;
  maxPrepTime?: number | null;
  mealCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Available diet options
const dietOptions = [
  { value: 'none', label: 'No specific diet' }, // Changed empty string to 'none'
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'ketogenic', label: 'Ketogenic' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'pescetarian', label: 'Pescetarian' },
  { value: 'whole30', label: 'Whole30' },
];

// Cuisine options
const cuisineOptions = [
  'African', 'American', 'British', 'Caribbean', 'Chinese', 'Eastern European',
  'French', 'German', 'Greek', 'Indian', 'Irish', 'Italian', 'Japanese', 'Korean',
  'Latin American', 'Mediterranean', 'Mexican', 'Middle Eastern', 'Nordic',
  'Spanish', 'Thai', 'Vietnamese'
];

const Preferences = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [newAllergy, setNewAllergy] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [newCuisine, setNewCuisine] = useState('');
  
  // Initialize form with default values
  const form = useForm<UserPreferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      name: '',
      diet: 'none', // Changed empty string to 'none'
      calorieTarget: 2000,
      proteinTarget: 100,
      carbTarget: 250,
      fatTarget: 70,
      mealCount: 3,
      cookingTime: 30,
      servings: 2,
      allergies: [],
      dislikes: [],
      cuisinePreferences: [],
    }
  });
  
  // Fetch user profile data
  const { isLoading } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ success: boolean, preferences: BackendPreferencesResponse }>('/users/preferences');
        
        if (response.success && response.preferences) {
          // Transform backend data to frontend format
          const backendPrefs = response.preferences;
          const frontendPrefs: Partial<UserPreferences> = {
            diet: backendPrefs.diet || 'none', // Changed empty string to 'none'
            allergies: backendPrefs.allergies || [],
            dislikes: backendPrefs.dislikes || [],
            cuisinePreferences: backendPrefs.cuisinePreferences || [],
            mealCount: backendPrefs.mealCount || 3,
            // Map maxPrepTime to cookingTime
            cookingTime: backendPrefs.maxPrepTime || 30,
            // Default servings if not present
            servings: 2,
          };

          // Handle nested goals object
          if (backendPrefs.goals) {
            frontendPrefs.calorieTarget = backendPrefs.goals.targetCalories;
            frontendPrefs.proteinTarget = backendPrefs.goals.targetProtein;
            frontendPrefs.carbTarget = backendPrefs.goals.targetCarbs;
            frontendPrefs.fatTarget = backendPrefs.goals.targetFat;
          }
          
          // Update form with transformed data
          Object.entries(frontendPrefs).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              form.setValue(key as keyof UserPreferences, value);
            }
          });
          
          console.log('Transformed preferences:', frontendPrefs);
          return frontendPrefs;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        toast.error('Failed to load your preferences');
        return null;
      }
    }
  });
  
  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: (data: UserPreferences) => {
      // Transform frontend data to backend format
      const backendData: BackendPreferencesResponse = {
        diet: data.diet === 'none' ? null : data.diet,
        allergies: data.allergies,
        dislikes: data.dislikes,
        cuisinePreferences: data.cuisinePreferences,
        mealCount: data.mealCount,
        // Map cookingTime to maxPrepTime
        maxPrepTime: data.cookingTime,
        // Package nutrition targets into goals object
        goals: {
          targetCalories: data.calorieTarget,
          targetProtein: data.proteinTarget,
          targetCarbs: data.carbTarget,
          targetFat: data.fatTarget,
        }
      };
      
      console.log('Saving preferences:', backendData);
      return apiClient.put('/users/preferences', backendData);
    },
    onSuccess: () => {
      toast.success('Preferences saved successfully');
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
    onError: (error) => {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  });
  
  // Handle form submission
  const onSubmit = (data: UserPreferences) => {
    savePreferencesMutation.mutate(data);
  };
  
  // Add new allergy
  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    
    const currentAllergies = form.getValues('allergies') || [];
    if (!currentAllergies.includes(newAllergy)) {
      form.setValue('allergies', [...currentAllergies, newAllergy]);
    }
    
    setNewAllergy('');
  };
  
  // Remove allergy
  const handleRemoveAllergy = (allergy: string) => {
    const currentAllergies = form.getValues('allergies') || [];
    form.setValue('allergies', currentAllergies.filter(a => a !== allergy));
  };
  
  // Add new dislike
  const handleAddDislike = () => {
    if (!newDislike.trim()) return;
    
    const currentDislikes = form.getValues('dislikes') || [];
    if (!currentDislikes.includes(newDislike)) {
      form.setValue('dislikes', [...currentDislikes, newDislike]);
    }
    
    setNewDislike('');
  };
  
  // Remove dislike
  const handleRemoveDislike = (dislike: string) => {
    const currentDislikes = form.getValues('dislikes') || [];
    form.setValue('dislikes', currentDislikes.filter(d => d !== dislike));
  };
  
  // Add new cuisine preference
  const handleAddCuisine = () => {
    if (!newCuisine) return;
    
    const currentCuisines = form.getValues('cuisinePreferences') || [];
    if (!currentCuisines.includes(newCuisine)) {
      form.setValue('cuisinePreferences', [...currentCuisines, newCuisine]);
    }
    
    setNewCuisine('');
  };
  
  // Remove cuisine preference
  const handleRemoveCuisine = (cuisine: string) => {
    const currentCuisines = form.getValues('cuisinePreferences') || [];
    form.setValue('cuisinePreferences', currentCuisines.filter(c => c !== cuisine));
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Customize your meal planning and recipe recommendations
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic information for personalization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for personalizing your meal plans
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Dietary Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
              <CardDescription>
                Set your dietary restrictions and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="diet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diet Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a diet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dietOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select your preferred diet type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              {/* Allergies */}
              <div className="space-y-2">
                <FormLabel>Allergies</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an allergy (e.g., peanuts)"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllergy();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddAllergy}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch('allergies')?.map((allergy) => (
                    <Badge key={allergy} variant="secondary" className="gap-1">
                      {allergy}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveAllergy(allergy)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Add any allergies or ingredients to avoid
                </FormDescription>
              </div>
              
              {/* Dislikes */}
              <div className="space-y-2">
                <FormLabel>Disliked Ingredients</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a disliked ingredient"
                    value={newDislike}
                    onChange={(e) => setNewDislike(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDislike();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddDislike}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch('dislikes')?.map((dislike) => (
                    <Badge key={dislike} variant="secondary" className="gap-1">
                      {dislike}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveDislike(dislike)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Add ingredients you dislike or want to avoid
                </FormDescription>
              </div>
              
              {/* Cuisine Preferences */}
              <div className="space-y-2">
                <FormLabel>Cuisine Preferences</FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={setNewCuisine}
                    value={newCuisine}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineOptions.map(cuisine => (
                        <SelectItem key={cuisine} value={cuisine}>
                          {cuisine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddCuisine}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch('cuisinePreferences')?.map((cuisine) => (
                    <Badge key={cuisine} variant="secondary" className="gap-1">
                      {cuisine}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveCuisine(cuisine)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Select cuisines you prefer
                </FormDescription>
              </div>
            </CardContent>
          </Card>
          
          {/* Nutrition Targets Section */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Targets</CardTitle>
              <CardDescription>
                Set your nutritional goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="calorieTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Calorie Target</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Slider
                          min={500}
                          max={5000}
                          step={50}
                          value={[field.value || 2000]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </div>
                      <div className="w-16 text-right font-medium">
                        {field.value} kcal
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="proteinTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Slider
                            min={0}
                            max={300}
                            step={5}
                            value={[field.value || 100]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </div>
                        <div className="w-12 text-right font-medium">
                          {field.value}g
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="carbTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Slider
                            min={0}
                            max={500}
                            step={5}
                            value={[field.value || 250]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                        />
                        </div>
                        <div className="w-12 text-right font-medium">
                          {field.value}g
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fatTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Slider
                            min={0}
                            max={200}
                            step={5}
                            value={[field.value || 70]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </div>
                        <div className="w-12 text-right font-medium">
                          {field.value}g
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Meal Planning Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Meal Planning Preferences</CardTitle>
              <CardDescription>
                Set your preferences for meal planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="mealCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meals per Day</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Slider
                          min={1}
                          max={6}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </div>
                      <div className="w-16 text-right font-medium">
                        {field.value} meals
                      </div>
                    </div>
                    <FormDescription>
                      Number of meals to plan per day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cookingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Cooking Time</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Slider
                          min={10}
                          max={180}
                          step={5}
                          value={[field.value || 30]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </div>
                      <div className="w-16 text-right font-medium">
                        {field.value} min
                      </div>
                    </div>
                    <FormDescription>
                      Maximum time you want to spend cooking a meal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Servings</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Slider
                          min={1}
                          max={12}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </div>
                      <div className="w-16 text-right font-medium">
                        {field.value} {field.value === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    <FormDescription>
                      Default number of servings for recipes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Preferences;