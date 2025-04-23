import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApiClient, UserProfile } from '@/lib/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export function MealPlanGenerator() {
  const apiClient = useApiClient();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [days, setDays] = useState(3);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<Partial<UserProfile> | null>(null);

  // Fetch user preferences when component mounts
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await apiClient.getUserProfile();
        if (response.success && response.profile) {
          setUserPreferences(response.profile);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        toast.error('Could not load your preferences');
      }
    };

    fetchUserPreferences();
  }, [apiClient]);

  const handleGenerateMealPlan = async () => {
    try {
      setIsLoading(true);
      toast.loading('Generating your meal plan...', { id: 'generate-meal-plan' });

      const response = await apiClient.generateMealPlan({
        date,
        days,
        preferences: userPreferences || undefined
      });

      toast.dismiss('generate-meal-plan');
      
      if (response.success) {
        toast.success('Meal plan generated successfully!');
        // Navigate to the meal plan view
        if (response.mealPlans?.length > 0) {
          navigate(`/meal-plan?id=${response.mealPlans[0].id}`);
        } else {
          navigate('/meal-plan');
        }
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error('Failed to generate meal plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 transition-all hover:shadow-md">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Generate Meal Plan</h2>
          <p className="text-muted-foreground">Create a custom meal plan based on your preferences</p>
        </div>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Starting Date</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[240px] flex justify-start text-left font-normal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {date ? format(new Date(date), 'PPP') : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date ? new Date(date) : undefined}
                    onSelect={(date) => {
                      setDate(date ? format(date, 'yyyy-MM-dd') : '');
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="days">Number of Days</Label>
            <Select 
              value={days.toString()} 
              onValueChange={(value) => setDays(Number(value))}
            >
              {[1, 2, 3, 5, 7, 14].map(d => (
                <option key={d} value={d.toString()}>
                  {d} {d === 1 ? 'day' : 'days'}
                </option>
              ))}
            </Select>
          </div>
          
          <Button
            onClick={handleGenerateMealPlan}
            disabled={isLoading}
            className="w-full mt-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Meal Plan'
            )}
          </Button>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <div className="flex items-start">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p>
                This will create a meal plan for {days} {days === 1 ? 'day' : 'days'} starting from{' '}
                {format(new Date(date), 'MMMM d, yyyy')}.
              </p>
              <p className="mt-1">
                Your saved preferences and dietary restrictions will be used for generating the plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}