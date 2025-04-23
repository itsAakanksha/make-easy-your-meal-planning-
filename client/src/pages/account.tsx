// filepath: e:\goldi\Projects\ai_meal_planner\client\src\pages\account.tsx
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApiClient, UserProfile } from '../lib/api/client';
import { User, Settings, CreditCard, UserCog, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user } = useUser();
  const apiClient = useApiClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const response = await apiClient.getUserProfile();
        if (response.success && response.profile) {
          setProfile(response.profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [apiClient]);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account details and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center mb-6 pt-4">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.fullName || 'User'} 
                    className="h-24 w-24 rounded-full mb-4" 
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                )}
                <h2 className="font-semibold text-lg">{user?.fullName}</h2>
                <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              
              <nav className="space-y-1">
                <Button 
                  variant={activeTab === "profile" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button 
                  variant={activeTab === "preferences" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("preferences")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Button>
                <Button 
                  variant={activeTab === "subscription" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("subscription")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscription
                </Button>
                <Button 
                  variant={activeTab === "privacy" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("privacy")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Privacy
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 hidden">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your basic profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-muted animate-pulse h-12 rounded-md" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="name">
                          Full Name
                        </label>
                        <input
                          id="name"
                          className="rounded-md border border-input bg-background px-3 py-2"
                          value={user?.fullName || ''}
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground">
                          Your name is managed through your authentication provider
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="email">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="rounded-md border border-input bg-background px-3 py-2"
                          value={user?.primaryEmailAddress?.emailAddress || ''}
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground">
                          Your email is managed through your authentication provider
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="joined">
                          Joined
                        </label>
                        <input
                          id="joined"
                          className="rounded-md border border-input bg-background px-3 py-2"
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                          readOnly
                        />
                      </div>
                      
                      <div className="flex items-center pt-4">
                        <Button disabled className="mr-2">Update Profile</Button>
                        <p className="text-sm text-muted-foreground">
                          Profile management coming soon...
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Dietary Preferences</CardTitle>
                  <CardDescription>
                    Manage your dietary preferences and nutritional goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="mb-4 pb-4 border-b">
                      <h3 className="font-medium mb-2">Current Preferences</h3>
                      {isLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-muted animate-pulse h-8 rounded-md" />
                          ))}
                        </div>
                      ) : profile ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Diet Type:</span>
                            <span className="font-medium capitalize">{profile.diet || 'Not specified'}</span>
                          </div>
                          
                          {profile.goalType && (
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Goal:</span>
                              <span className="font-medium capitalize">{profile.goalType.replace(/-/g, ' ')}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Daily Calories:</span>
                            <span className="font-medium">{profile.calorieTarget ? `${profile.calorieTarget} calories` : 'Not specified'}</span>
                          </div>
                          
                          {profile.proteinTarget && (
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Daily Protein:</span>
                              <span className="font-medium">{profile.proteinTarget}g</span>
                            </div>
                          )}
                          
                          {profile.budgetPerMeal && (
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Budget per Meal:</span>
                              <span className="font-medium">${(profile.budgetPerMeal / 100).toFixed(2)}</span>
                            </div>
                          )}
                          
                          {profile.cookingTime && (
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Max Cooking Time:</span>
                              <span className="font-medium">{profile.cookingTime} minutes</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Allergies:</span>
                            <span className="font-medium">
                              {profile.allergies?.length 
                                ? profile.allergies.join(', ') 
                                : 'None specified'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Preferred Cuisines:</span>
                            <span className="font-medium">
                              {profile.cuisinePreferences?.length 
                                ? profile.cuisinePreferences.join(', ') 
                                : 'None specified'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No preferences set yet</p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => window.location.href = "/meal-plan?tab=preferences"}
                    >
                      Edit Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subscription" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Premium Plan</h3>
                      <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      You have unlimited access to all premium features.
                    </p>
                    <div className="text-sm">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Next billing date:</span>
                        <span className="font-medium">May 21, 2025</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Amount:</span>
                        <span className="font-medium">$9.99/month</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full">Manage Subscription</Button>
                    <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="privacy" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Manage your privacy preferences and data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about new features and updates
                        </p>
                      </div>
                      <div className="h-6 w-10 bg-primary/80 rounded-full relative cursor-pointer">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Data Collection</h3>
                        <p className="text-sm text-muted-foreground">
                          Help improve our service by sharing anonymous usage data
                        </p>
                      </div>
                      <div className="h-6 w-10 bg-primary/80 rounded-full relative cursor-pointer">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline" className="w-full mb-3">Download My Data</Button>
                      <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}