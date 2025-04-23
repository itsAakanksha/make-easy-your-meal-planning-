import { Route, Switch } from "wouter";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/queryClient";
import { Sidebar } from "./components/sidebar";
import { BottomNav } from "./components/navigation/bottom-nav";
import { ThemeProvider } from "./components/ui/theme-provider";

// Pages
import Home from "./pages/home";
import Recipes from "./pages/recipes";
import Recipe from "./pages/recipe";
import MealPlan from "./pages/meal-plan";
import ShoppingList from "./pages/shopping-list";
import Account from "./pages/account";

// Import CSS
import "./App.css";

// Route that requires authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ai-meal-planner-theme">
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {/* Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-4 min-h-screen">
              <Switch>
                <Route path="/" component={Home} />
                
                <Route path="/recipes">
                  <ProtectedRoute>
                    <Recipes />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/recipes/:id">
                  <ProtectedRoute>
                    <Recipe />
                  </ProtectedRoute>
                </Route>
                
                {/* Add route for singular "recipe" URLs */}
                <Route path="/recipe/:id">
                  <ProtectedRoute>
                    <Recipe />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/meal-plan">
                  <ProtectedRoute>
                    <MealPlan />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/shopping-list">
                  <ProtectedRoute>
                    <ShoppingList />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/account">
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                </Route>
                
                <Route>404 Not Found</Route>
              </Switch>
            </div>
          </main>

          {/* Bottom Navigation - only shown on mobile */}
          <BottomNav />
        </div>
        
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
