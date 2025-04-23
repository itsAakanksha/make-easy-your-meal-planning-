import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useApiClient, UserProfile } from '../../lib/api/client';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../ui/accordion';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select } from '../ui/select';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// Form validation schema
const preferencesSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  diet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dislikes: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  goalType: z.string().optional(),
  calorieTarget: z.number().positive().optional(),
  proteinTarget: z.number().positive().optional(),
  carbTarget: z.number().positive().optional(),
  fatTarget: z.number().positive().optional(),
  mealCount: z.number().min(1).max(6).default(3),
  budgetPerMeal: z.number().positive().optional(),
  cookingTime: z.number().positive().optional(),
  servings: z.number().positive().default(1),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

// Dietary options
const dietOptions = [
  { value: '', label: 'No specific diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'ketogenic', label: 'Ketogenic' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'pescetarian', label: 'Pescetarian' },
  { value: 'low-fodmap', label: 'Low FODMAP' },
];

const allergyOptions = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'egg', label: 'Eggs' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'grain', label: 'Grain' },
  { value: 'peanut', label: 'Peanuts' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'soy', label: 'Soy' },
  { value: 'sulfite', label: 'Sulfites' },
  { value: 'tree-nut', label: 'Tree Nuts' },
  { value: 'wheat', label: 'Wheat' },
];

const cuisineOptions = [
  { value: 'american', label: 'American' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'french', label: 'French' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'greek', label: 'Greek' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'korean', label: 'Korean' },
];

const goalOptions = [
  { value: 'weight-loss', label: 'Weight Loss' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'muscle-gain', label: 'Muscle Gain' },
  { value: 'health', label: 'General Health' },
];

export function PreferencesForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dietary");
  const apiClient = useApiClient();
  
  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      mealCount: 3,
      servings: 1,
      allergies: [],
      cuisinePreferences: [],
      dislikes: [],
    },
  });

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getUserProfile();
        
        console.log('User profile API response:', response);
        
        if (response.success && response.profile) {
          console.log('Got user profile data:', response.profile);
          populateFormWithProfile(response.profile);
        } else {
          console.warn('API returned success but no profile data:', response);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [apiClient]);

  // Helper function to populate form with profile data
  const populateFormWithProfile = (profile: UserProfile) => {
    console.log('Populating form with profile data:', profile);
    const fieldsToExclude = ['id', 'userId', 'createdAt', 'updatedAt'];
    
    // Reset form with profile data
    const formData: Partial<PreferencesFormData> = {};
    
    // Process each field in the profile
    Object.entries(profile).forEach(([key, value]) => {
      if (!fieldsToExclude.includes(key) && value !== null && value !== undefined) {
        console.log(`Setting form field ${key} to:`, value);
        
        // Special case for budgetPerMeal which is stored in cents but displayed in dollars
        if (key === 'budgetPerMeal' && typeof value === 'number') {
          formData[key] = value / 100;
        } else {
          // @ts-ignore - We know these fields exist in our form
          formData[key] = value;
        }
      }
    });
    
    console.log('Final form data to be set:', formData);
    reset(formData as PreferencesFormData);
  };

  // Form submission handler
  const onSubmit = async (data: PreferencesFormData) => {
    try {
      setIsLoading(true);
      
      // Clean up data before sending
      const payload = { ...data };
      
      // Convert empty strings to null/undefined
      Object.entries(payload).forEach(([key, value]) => {
        if (value === '') {
          // @ts-ignore
          payload[key] = undefined;
        }
      });
      
      // Convert budgetPerMeal from dollars to cents
      if (payload.budgetPerMeal) {
        payload.budgetPerMeal = Math.round(payload.budgetPerMeal * 100);
      }
      
      console.log('Submitting profile data:', payload);
      const response = await apiClient.updateUserProfile(payload);
      
      if (response.success) {
        toast.success('Preferences saved successfully');
      } else {
        // Handle unsuccessful response
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      // Always reset loading state, regardless of outcome
      setIsLoading(false);
    }
  };

  const allergies = watch('allergies') || [];
  const cuisinePrefs = watch('cuisinePreferences') || [];

  // Toggle allergy selection
  const toggleAllergy = (value: string) => {
    const currentAllergies = [...allergies];
    const index = currentAllergies.indexOf(value);
    
    if (index === -1) {
      currentAllergies.push(value);
    } else {
      currentAllergies.splice(index, 1);
    }
    
    setValue('allergies', currentAllergies, { shouldDirty: true });
  };

  // Toggle cuisine selection
  const toggleCuisine = (value: string) => {
    const current = [...cuisinePrefs];
    const index = current.indexOf(value);
    
    if (index === -1) {
      current.push(value);
    } else {
      current.splice(index, 1);
    }
    
    setValue('cuisinePreferences', current, { shouldDirty: true });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card className="border-0 shadow-xl bg-white dark:bg-gray-950">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Your Meal Preferences</CardTitle>
          <CardDescription className="text-white/90">
            Customize your meal plans to match your dietary needs and taste preferences
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="dietary" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="dietary">Dietary</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
              </TabsList>
              
              {/* Dietary Preferences Tab */}
              <TabsContent value="dietary" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Diet Type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RadioGroup 
                      value={watch('diet') || ''}
                      onValueChange={(value) => setValue('diet', value, { shouldDirty: true })}
                    >
                      {dietOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`diet-${option.value}`} />
                          <Label htmlFor={`diet-${option.value}`}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Allergies & Intolerances</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {allergyOptions.map((allergy) => (
                      <div key={allergy.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`allergy-${allergy.value}`} 
                          checked={allergies.includes(allergy.value)}
                          onCheckedChange={() => toggleAllergy(allergy.value)}
                        />
                        <label 
                          htmlFor={`allergy-${allergy.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {allergy.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cuisine Preferences</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cuisineOptions.map((cuisine) => (
                      <div key={cuisine.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cuisine-${cuisine.value}`} 
                          checked={cuisinePrefs.includes(cuisine.value)}
                          onCheckedChange={() => toggleCuisine(cuisine.value)}
                        />
                        <label 
                          htmlFor={`cuisine-${cuisine.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {cuisine.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("personal")}>
                    Back to Personal
                  </Button>
                  <Button onClick={() => setActiveTab("nutrition")}>
                    Next: Nutrition Goals
                  </Button>
                </div>
              </TabsContent>
              
              {/* Nutrition Goals Tab */}
              <TabsContent value="nutrition" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Health Goals</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RadioGroup 
                      value={watch('goalType') || ''}
                      onValueChange={(value) => setValue('goalType', value, { shouldDirty: true })}
                    >
                      {goalOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`goal-${option.value}`} />
                          <Label htmlFor={`goal-${option.value}`}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Nutritional Targets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calorieTarget">Daily Calories (kcal)</Label>
                      <Input
                        id="calorieTarget"
                        type="number"
                        placeholder="e.g., 2000"
                        {...register('calorieTarget', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="proteinTarget">Protein (g)</Label>
                      <Input
                        id="proteinTarget"
                        type="number"
                        placeholder="e.g., 100"
                        {...register('proteinTarget', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="carbTarget">Carbohydrates (g)</Label>
                      <Input
                        id="carbTarget"
                        type="number"
                        placeholder="e.g., 250"
                        {...register('carbTarget', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fatTarget">Fat (g)</Label>
                      <Input
                        id="fatTarget"
                        type="number"
                        placeholder="e.g., 70"
                        {...register('fatTarget', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("dietary")}>
                    Back to Dietary
                  </Button>
                  <Button onClick={() => setActiveTab("planning")}>
                    Next: Meal Planning
                  </Button>
                </div>
              </TabsContent>
              
              {/* Meal Planning Tab */}
              <TabsContent value="planning" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Meal Structure</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mealCount">Meals per Day</Label>
                      <Select 
                        value={watch('mealCount')?.toString()} 
                        onValueChange={(value) => setValue('mealCount', Number(value), { shouldDirty: true })}
                      >
                        {[1, 2, 3, 4, 5, 6].map(count => (
                          <option key={count} value={count.toString()}>
                            {count} {count === 1 ? 'meal' : 'meals'}
                          </option>
                        ))}
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="servings">Servings per Meal</Label>
                      <Select
                        value={watch('servings')?.toString()}
                        onValueChange={(value) => setValue('servings', Number(value), { shouldDirty: true })}
                      >
                        {[1, 2, 3, 4, 5, 6].map(count => (
                          <option key={count} value={count.toString()}>
                            {count} {count === 1 ? 'person' : 'people'}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Practical Constraints</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cookingTime">Max Cooking Time (minutes)</Label>
                      <Input
                        id="cookingTime"
                        type="number"
                        placeholder="e.g., 30"
                        {...register('cookingTime', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum time you want to spend cooking a meal
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="budgetPerMeal">Budget per Meal ($)</Label>
                      <Input
                        id="budgetPerMeal"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 10"
                        {...register('budgetPerMeal', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated cost per serving
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("nutrition")}>
                    Back to Nutrition
                  </Button>
                  <Button onClick={() => setActiveTab("personal")}>
                    Next: Personal Info
                  </Button>
                </div>
              </TabsContent>
              
              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        {...register('name')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Your email address"
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("planning")}>
                    Back to Planning
                  </Button>
                  <Button onClick={() => setActiveTab("dietary")}>
                    Next: Dietary
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <p>Your preferences will be applied to all your future meal plans.</p>
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                size="lg"
                disabled={isLoading || !isDirty}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}