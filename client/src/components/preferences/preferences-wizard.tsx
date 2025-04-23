import { useState, useEffect } from "react";
import { useApiClient, UserProfile } from "../../lib/api/client";
import { toast } from "sonner";
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Flame, 
  Heart, 
  Salad, 
  Utensils, 
  Egg, 
  Pizza,
  Banana,
  Beef,
  Fish,
  Soup,
  Dumbbell,
  Scale,
  CreditCard,
  Sparkles
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

interface DietOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface AllergyOption {
  id: string;
  label: string;
}

interface CuisineOption {
  id: string;
  label: string;
  imageUrl: string;
}

interface StepProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isLastStep?: boolean;
}

// Dietary options
const dietOptions: DietOption[] = [
  { 
    id: "none", 
    label: "No Restrictions", 
    description: "I eat everything",
    icon: <Utensils className="h-6 w-6" />
  },
  { 
    id: "vegetarian", 
    label: "Vegetarian", 
    description: "No meat, poultry, or seafood",
    icon: <Salad className="h-6 w-6" />
  },
  { 
    id: "vegan", 
    label: "Vegan", 
    description: "No animal products",
    icon: <Banana className="h-6 w-6" />
  },
  { 
    id: "gluten-free", 
    label: "Gluten-Free", 
    description: "No gluten-containing ingredients",
    icon: <Pizza className="h-6 w-6" />
  },
  { 
    id: "ketogenic", 
    label: "Ketogenic", 
    description: "Low carb, high fat",
    icon: <Beef className="h-6 w-6" />
  },
  { 
    id: "paleo", 
    label: "Paleo", 
    description: "Based on foods available to our ancestors",
    icon: <Flame className="h-6 w-6" />
  },
  { 
    id: "pescetarian", 
    label: "Pescetarian", 
    description: "Vegetarian plus seafood",
    icon: <Fish className="h-6 w-6" />
  },
  { 
    id: "low-fodmap", 
    label: "Low FODMAP", 
    description: "Limits certain fermentable carbs",
    icon: <Soup className="h-6 w-6" />
  },
];

// Allergy options
const allergyOptions: AllergyOption[] = [
  { id: "dairy", label: "Dairy" },
  { id: "egg", label: "Eggs" },
  { id: "gluten", label: "Gluten" },
  { id: "grain", label: "Grain" },
  { id: "peanut", label: "Peanuts" },
  { id: "seafood", label: "Seafood" },
  { id: "shellfish", label: "Shellfish" },
  { id: "soy", label: "Soy" },
  { id: "sulfite", label: "Sulfites" },
  { id: "tree-nut", label: "Tree Nuts" },
  { id: "wheat", label: "Wheat" },
];

// Cuisine options
const cuisineOptions: CuisineOption[] = [
  { id: "american", label: "American", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=American" },
  { id: "italian", label: "Italian", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Italian" },
  { id: "mexican", label: "Mexican", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Mexican" },
  { id: "asian", label: "Asian", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Asian" },
  { id: "mediterranean", label: "Mediterranean", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Mediterranean" },
  { id: "indian", label: "Indian", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Indian" },
  { id: "middle-eastern", label: "Middle Eastern", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Middle-Eastern" },
  { id: "french", label: "French", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=French" },
  { id: "caribbean", label: "Caribbean", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Caribbean" },
  { id: "greek", label: "Greek", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Greek" },
  { id: "chinese", label: "Chinese", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Chinese" },
  { id: "japanese", label: "Japanese", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Japanese" },
  { id: "thai", label: "Thai", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Thai" },
  { id: "spanish", label: "Spanish", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Spanish" },
  { id: "korean", label: "Korean", imageUrl: "https://placehold.co/100x100/FCFCFC/B9B9B9?text=Korean" },
];

// Goal options
const goalOptions = [
  { id: "weight-loss", label: "Weight Loss", icon: <Scale className="h-6 w-6" /> },
  { id: "maintenance", label: "Maintenance", icon: <Heart className="h-6 w-6" /> },
  { id: "muscle-gain", label: "Muscle Gain", icon: <Dumbbell className="h-6 w-6" /> },
  { id: "health", label: "General Health", icon: <Sparkles className="h-6 w-6" /> },
];

// Individual step component
function WizardStep({ 
  title, 
  description, 
  children, 
  onNext, 
  onBack, 
  nextLabel = "Next", 
  backLabel = "Back",
  isLastStep = false
}: StepProps) {
  return (
    <div className="space-y-6 p-1">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="mb-8">{children}</div>

      <div className="flex justify-between mt-8">
        {onBack ? (
          <Button onClick={onBack} variant="outline" type="button">
            <ChevronLeft className="mr-2 h-4 w-4" /> {backLabel}
          </Button>
        ) : (
          <div></div>
        )}
        <Button onClick={onNext} type="button">
          {isLastStep ? (
            "Finish"
          ) : (
            <>
              {nextLabel} <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Diet selection card
function DietCard({ 
  diet, 
  selected, 
  onSelect 
}: { 
  diet: DietOption; 
  selected: boolean; 
  onSelect: () => void 
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300",
        selected 
          ? "border-primary bg-primary/5 shadow-md" 
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900/50"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex items-center justify-center h-12 w-12 rounded-full",
          selected ? "bg-primary text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        )}>
          {diet.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-lg">{diet.label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{diet.description}</p>
        </div>
        {selected && (
          <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

// Allergy selection component
function AllergySelector({
  allergies,
  selected,
  onToggle,
}: {
  allergies: AllergyOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {allergies.map((allergy) => (
        <div
          key={allergy.id}
          className={cn(
            "flex items-center space-x-2 rounded-lg border p-3 transition-all",
            selected.includes(allergy.id)
              ? "border-primary bg-primary/5"
              : "hover:bg-gray-50 dark:hover:bg-gray-900"
          )}
          onClick={() => onToggle(allergy.id)}
        >
          <Checkbox
            id={`allergy-${allergy.id}`}
            checked={selected.includes(allergy.id)}
            onCheckedChange={() => onToggle(allergy.id)}
          />
          <label
            htmlFor={`allergy-${allergy.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {allergy.label}
          </label>
        </div>
      ))}
    </div>
  );
}

// Cuisine selection component
function CuisineSelector({
  cuisines,
  selected,
  onToggle,
}: {
  cuisines: CuisineOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {cuisines.map((cuisine) => (
        <div
          key={cuisine.id}
          className={cn(
            "relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group aspect-square",
            selected.includes(cuisine.id)
              ? "ring-4 ring-primary"
              : "hover:opacity-90"
          )}
          onClick={() => onToggle(cuisine.id)}
        >
          <img
            src={cuisine.imageUrl}
            alt={cuisine.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
            <span className="text-white font-medium">{cuisine.label}</span>
          </div>
          {selected.includes(cuisine.id) && (
            <div className="absolute top-2 right-2 bg-primary text-white h-6 w-6 flex items-center justify-center rounded-full">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Goal selection component
function GoalSelector({
  goals,
  selected,
  onSelect,
}: {
  goals: typeof goalOptions;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className={cn(
            "border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4",
            selected === goal.id
              ? "border-primary bg-primary/5"
              : "hover:bg-gray-50 dark:hover:bg-gray-900"
          )}
          onClick={() => onSelect(goal.id)}
        >
          <div className={cn(
            "p-2 rounded-full",
            selected === goal.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {goal.icon}
          </div>
          <div>
            <RadioGroup value={selected} onValueChange={onSelect}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={goal.id} id={goal.id} />
                <Label htmlFor={goal.id} className="font-medium">
                  {goal.label}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PreferencesWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<Partial<UserProfile>>({
    diet: "",
    allergies: [],
    cuisinePreferences: [],
    goalType: "",
    calorieTarget: 2000,
    proteinTarget: 100,
    carbTarget: 200,
    fatTarget: 70,
    mealCount: 3,
    cookingTime: 30,
    budgetPerMeal: 500, // in cents
    servings: 1,
  });
  
  const apiClient = useApiClient();
  
  const totalSteps = 6;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
  
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getUserProfile();
        
        if (response.success && response.profile) {
          setPreferences(response.profile);
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
  
  // Save preferences handler
  const savePreferences = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.updateUserProfile(preferences);
      
      if (response.success) {
        toast.success('Preferences saved successfully!');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle progress to next step
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Final step - save preferences
      savePreferences();
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Update preferences
  const updatePreference = (key: keyof UserProfile, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Toggle array values (for allergies and cuisines)
  const toggleArrayValue = (key: keyof UserProfile, value: string) => {
    setPreferences(prev => {
      const currentArray = prev[key] as string[] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
        
      return {
        ...prev,
        [key]: newArray
      };
    });
  };
  
  // Format dollar amount
  const formatDollars = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Helper for slider labels
  const getTimeLabel = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-4">
      <Card className="border-0 shadow-xl overflow-hidden">
        {/* Progress header */}
        <div className="bg-primary text-white p-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-white/20" 
            indicatorClassName="bg-white" 
          />
        </div>
        
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Welcome & Diet */}
              {currentStep === 0 && (
                <WizardStep
                  title="Welcome to Your Personalized Meal Planner"
                  description="Let's start by learning about your diet preferences"
                  onNext={handleNext}
                >
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium">Select your diet type:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dietOptions.map((diet) => (
                        <DietCard
                          key={diet.id}
                          diet={diet}
                          selected={preferences.diet === diet.id}
                          onSelect={() => updatePreference('diet', diet.id)}
                        />
                      ))}
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 2: Allergies */}
              {currentStep === 1 && (
                <WizardStep
                  title="Food Allergies & Intolerances"
                  description="Select any ingredients you'd like to avoid"
                  onNext={handleNext}
                  onBack={handleBack}
                >
                  <AllergySelector
                    allergies={allergyOptions}
                    selected={preferences.allergies || []}
                    onToggle={(value) => toggleArrayValue('allergies', value)}
                  />
                  
                  <div className="mt-6">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg p-4 flex">
                      <div className="flex-shrink-0 text-amber-500 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300">Important Note</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          We'll do our best to exclude these ingredients, but always check recipes and ingredients 
                          for yourself if you have severe allergies or medical conditions.
                        </p>
                      </div>
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 3: Cuisine Preferences */}
              {currentStep === 2 && (
                <WizardStep
                  title="Cuisine Preferences"
                  description="Select the cuisines you enjoy most"
                  onNext={handleNext}
                  onBack={handleBack}
                >
                  <CuisineSelector
                    cuisines={cuisineOptions}
                    selected={preferences.cuisinePreferences || []}
                    onToggle={(value) => toggleArrayValue('cuisinePreferences', value)}
                  />
                  
                  <div className="mt-6 text-center text-muted-foreground text-sm">
                    <p>Select as many as you'd like. This helps us create more diverse and enjoyable meal plans.</p>
                  </div>
                </WizardStep>
              )}

              {/* Step 4: Nutrition Goals */}
              {currentStep === 3 && (
                <WizardStep
                  title="Nutrition Goals"
                  description="Set your health and nutrition objectives"
                  onNext={handleNext}
                  onBack={handleBack}
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">What's your primary goal?</h3>
                      <GoalSelector
                        goals={goalOptions}
                        selected={preferences.goalType || ""}
                        onSelect={(value) => updatePreference('goalType', value)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Daily Calories & Macros</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Daily Calories</Label>
                            <span className="font-medium">{preferences.calorieTarget} kcal</span>
                          </div>
                          <Slider
                            value={[preferences.calorieTarget || 2000]}
                            min={1200}
                            max={4000}
                            step={50}
                            onValueChange={(value) => updatePreference('calorieTarget', value[0])}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1200 kcal</span>
                            <span>4000 kcal</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Protein</Label>
                              <span className="font-medium">{preferences.proteinTarget}g</span>
                            </div>
                            <Slider
                              value={[preferences.proteinTarget || 100]}
                              min={30}
                              max={300}
                              step={5}
                              onValueChange={(value) => updatePreference('proteinTarget', value[0])}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Carbs</Label>
                              <span className="font-medium">{preferences.carbTarget}g</span>
                            </div>
                            <Slider
                              value={[preferences.carbTarget || 200]}
                              min={20}
                              max={500}
                              step={5}
                              onValueChange={(value) => updatePreference('carbTarget', value[0])}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Fat</Label>
                              <span className="font-medium">{preferences.fatTarget}g</span>
                            </div>
                            <Slider
                              value={[preferences.fatTarget || 70]}
                              min={20}
                              max={200}
                              step={5}
                              onValueChange={(value) => updatePreference('fatTarget', value[0])}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 5: Meal Planning */}
              {currentStep === 4 && (
                <WizardStep
                  title="Meal Planning Preferences"
                  description="Set your practical meal planning constraints"
                  onNext={handleNext}
                  onBack={handleBack}
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Meals per Day</h3>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-6">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updatePreference('mealCount', Math.max(1, (preferences.mealCount || 3) - 1))}
                              disabled={preferences.mealCount === 1}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                              </svg>
                            </Button>
                            <span className="text-4xl font-bold">{preferences.mealCount}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updatePreference('mealCount', Math.min(6, (preferences.mealCount || 3) + 1))}
                              disabled={preferences.mealCount === 6}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </Button>
                          </div>
                          <span className="text-muted-foreground mt-2">
                            {preferences.mealCount} {preferences.mealCount === 1 ? 'meal' : 'meals'} per day
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Servings per Meal</h3>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-6">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updatePreference('servings', Math.max(1, (preferences.servings || 1) - 1))}
                              disabled={preferences.servings === 1}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                              </svg>
                            </Button>
                            <span className="text-4xl font-bold">{preferences.servings}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updatePreference('servings', Math.min(8, (preferences.servings || 1) + 1))}
                              disabled={preferences.servings === 8}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </Button>
                          </div>
                          <span className="text-muted-foreground mt-2">
                            For {preferences.servings} {preferences.servings === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Cooking Time</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Maximum time per meal: <strong>{getTimeLabel(preferences.cookingTime || 30)}</strong></span>
                        </div>
                        <Slider
                          value={[preferences.cookingTime || 30]}
                          min={10}
                          max={120}
                          step={5}
                          onValueChange={(value) => updatePreference('cookingTime', value[0])}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Quick (10 min)</span>
                          <span>Medium (45 min)</span>
                          <span>No rush (2h)</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Budget</h3>
                        <Badge variant="outline" className="font-normal">
                          {formatDollars(preferences.budgetPerMeal || 500)} per serving
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>Target cost per meal</span>
                        </div>
                        <Slider
                          value={[preferences.budgetPerMeal || 500]}
                          min={100}
                          max={2000}
                          step={100}
                          onValueChange={(value) => updatePreference('budgetPerMeal', value[0])}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Budget ({formatDollars(100)})</span>
                          <span>Standard ({formatDollars(1000)})</span>
                          <span>Premium ({formatDollars(2000)})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 6: Review & Complete */}
              {currentStep === 5 && (
                <WizardStep
                  title="Review Your Preferences"
                  description="You're all set! Here's a summary of your preferences."
                  onNext={handleNext}
                  onBack={handleBack}
                  nextLabel="Save Preferences"
                  isLastStep={true}
                >
                  <div className="space-y-6">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="diet">Diet</TabsTrigger>
                        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                        <TabsTrigger value="planning">Planning</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Diet Preferences</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Diet Type:</dt>
                                  <dd className="font-medium">
                                    {dietOptions.find(d => d.id === preferences.diet)?.label || 'None selected'}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Allergies:</dt>
                                  <dd>
                                    {preferences.allergies && preferences.allergies.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {preferences.allergies.map(allergy => (
                                          <Badge key={allergy} variant="secondary" className="font-normal">
                                            {allergyOptions.find(a => a.id === allergy)?.label}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-sm">None selected</span>
                                    )}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground mt-2">Cuisine Preferences:</dt>
                                  <dd>
                                    {preferences.cuisinePreferences && preferences.cuisinePreferences.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {preferences.cuisinePreferences.map(cuisine => (
                                          <Badge key={cuisine} variant="outline" className="font-normal">
                                            {cuisineOptions.find(c => c.id === cuisine)?.label}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-sm">None selected</span>
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Nutrition Goals</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Primary Goal:</dt>
                                  <dd className="font-medium">
                                    {goalOptions.find(g => g.id === preferences.goalType)?.label || 'None selected'}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Daily Calories:</dt>
                                  <dd className="font-medium">{preferences.calorieTarget || 2000} kcal</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Protein:</dt>
                                  <dd className="font-medium">{preferences.proteinTarget || 100}g</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Carbs:</dt>
                                  <dd className="font-medium">{preferences.carbTarget || 200}g</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Fat:</dt>
                                  <dd className="font-medium">{preferences.fatTarget || 70}g</dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                          
                          <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Meal Planning</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <dt className="text-muted-foreground">Meals per Day:</dt>
                                  <dd className="font-medium text-lg">{preferences.mealCount || 3}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Servings:</dt>
                                  <dd className="font-medium text-lg">{preferences.servings || 1}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Budget per Meal:</dt>
                                  <dd className="font-medium text-lg">{formatDollars(preferences.budgetPerMeal || 500)}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Max Cooking Time:</dt>
                                  <dd className="font-medium text-lg">{getTimeLabel(preferences.cookingTime || 30)}</dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="diet" className="pt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Diet Preferences</CardTitle>
                            <CardDescription>Your selected diet and cuisine preferences</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Diet Type</h4>
                                <div className="flex items-center gap-2">
                                  {dietOptions.find(d => d.id === preferences.diet)?.icon}
                                  <span>{dietOptions.find(d => d.id === preferences.diet)?.label || 'None selected'}</span>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Allergies & Intolerances</h4>
                                {preferences.allergies && preferences.allergies.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {preferences.allergies.map(allergy => (
                                      <Badge key={allergy} variant="secondary" className="font-normal">
                                        {allergyOptions.find(a => a.id === allergy)?.label}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No allergies selected</span>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Cuisine Preferences</h4>
                                {preferences.cuisinePreferences && preferences.cuisinePreferences.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {preferences.cuisinePreferences.map(cuisine => (
                                      <Badge key={cuisine} variant="outline" className="font-normal">
                                        {cuisineOptions.find(c => c.id === cuisine)?.label}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No cuisine preferences selected</span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="nutrition" className="pt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Nutrition Goals</CardTitle>
                            <CardDescription>Your calorie and macro targets</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                  {goalOptions.find(g => g.id === preferences.goalType)?.icon}
                                </div>
                                <div>
                                  <h4 className="font-medium">Primary Goal</h4>
                                  <p>{goalOptions.find(g => g.id === preferences.goalType)?.label || 'None selected'}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-3">Daily Targets</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 border rounded-lg">
                                    <div className="text-muted-foreground">Calories</div>
                                    <div className="text-2xl font-bold mt-1">{preferences.calorieTarget || 2000} kcal</div>
                                  </div>
                                  
                                  <div className="p-4 border rounded-lg">
                                    <div className="text-muted-foreground">Protein</div>
                                    <div className="text-2xl font-bold mt-1">{preferences.proteinTarget || 100}g</div>
                                  </div>
                                  
                                  <div className="p-4 border rounded-lg">
                                    <div className="text-muted-foreground">Carbohydrates</div>
                                    <div className="text-2xl font-bold mt-1">{preferences.carbTarget || 200}g</div>
                                  </div>
                                  
                                  <div className="p-4 border rounded-lg">
                                    <div className="text-muted-foreground">Fat</div>
                                    <div className="text-2xl font-bold mt-1">{preferences.fatTarget || 70}g</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="planning" className="pt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Meal Planning</CardTitle>
                            <CardDescription>Your meal structure and practical constraints</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border rounded-lg p-6 text-center">
                                  <h4 className="text-lg font-medium mb-2">Meals per Day</h4>
                                  <div className="text-4xl font-bold">{preferences.mealCount || 3}</div>
                                  <p className="text-muted-foreground mt-2">
                                    We'll generate {preferences.mealCount} {preferences.mealCount === 1 ? 'meal' : 'meals'} for each day
                                  </p>
                                </div>
                                
                                <div className="border rounded-lg p-6 text-center">
                                  <h4 className="text-lg font-medium mb-2">Servings per Meal</h4>
                                  <div className="text-4xl font-bold">{preferences.servings || 1}</div>
                                  <p className="text-muted-foreground mt-2">
                                    Each recipe will serve {preferences.servings} {preferences.servings === 1 ? 'person' : 'people'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="border rounded-lg p-6">
                                <h4 className="text-lg font-medium mb-4">Practical Constraints</h4>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                                      <span>Maximum cooking time per meal</span>
                                    </div>
                                    <Badge variant="outline" className="font-medium">
                                      {getTimeLabel(preferences.cookingTime || 30)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                                      <span>Target budget per serving</span>
                                    </div>
                                    <Badge variant="outline" className="font-medium">
                                      {formatDollars(preferences.budgetPerMeal || 500)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </WizardStep>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}