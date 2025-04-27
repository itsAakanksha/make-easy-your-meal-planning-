import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/use-auth.tsx'
import { ClerkLoaded, ClerkLoading } from '@clerk/clerk-react'

import { Toaster } from './components/ui/sonner'
import AuthLayout from './components/layouts/AuthLayout'

// Layouts
import AppLayout from './components/layouts/AppLayout'

// Public Pages
import LandingPage from './pages/Landing'
import SignInPage from './pages/auth/SignIn'
import SignUpPage from './pages/auth/SignUp'

// Protected Pages
import DashboardPage from './pages/Dashboard'
import RecipesPage from './pages/Recipes'
import MealPlanPage from './pages/MealPlan'

import RecipeDetailPage from './pages/RecipeDetail'
import PreferencesPage from './pages/Preferences'
import ShoppingListPage from './pages/ShoppingList'

// Protected Route Component using Clerk's best practices
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  return (
    <>
      <ClerkLoading>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-pulse text-primary">Loading authentication...</div>
        </div>
      </ClerkLoading>
      
      <ClerkLoaded>
        {isLoading ? (
          <div className="flex h-screen items-center justify-center">Loading...</div>
        ) : !isAuthenticated ? (
          <Navigate to="/signin" replace />
        ) : (
          <>{children}</>
        )}
      </ClerkLoaded>
    </>
  )
}

// Public Route Component (redirects to dashboard if already signed in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  return (
    <>
      <ClerkLoading>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-pulse text-primary">Loading authentication...</div>
        </div>
      </ClerkLoading>
      
      <ClerkLoaded>
        {isLoading ? (
          <div className="flex h-screen items-center justify-center">Loading...</div>
        ) : isAuthenticated ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <>{children}</>
        )}
      </ClerkLoaded>
    </>
  )
}

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meal-plan" element={<MealPlanPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
        </Route>
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster position="top-right" closeButton />
    </>
  )
}

export default App