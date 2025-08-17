import { useContext, createContext, useState, useEffect, useCallback } from 'react';
import { 
  useAuth as useClerkAuth,
  useUser,
  useClerk,
  useSignIn,
  useSignUp
} from '@clerk/clerk-react';
import { toast } from 'sonner';

// Auth context type with improved typing
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: ReturnType<typeof useUser>['user'];
  signIn: (redirectUrl?: string) => void;
  signUp: (redirectUrl?: string) => void;
  signOut: (redirectUrl?: string) => Promise<void>;
  getToken: () => Promise<string | null>;
  ensureUserRegistered: () => Promise<boolean>;
  error: string | null;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth Provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [error, setError] = useState<string | null>(null);
  
  // Use Clerk's built-in hooks
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const { signIn: clerkSignIn } = useSignIn();
  const { signUp: clerkSignUp} = useSignUp();
  
  // Check if authenticated
  const isAuthenticated = isSignedIn === true;
  const isLoading = !isLoaded;
  const userId = user?.id || null;
  
  // Clear errors when auth state changes
  useEffect(() => {
    if (isLoaded && error) {
      setError(null);
    }
  }, [isLoaded, isSignedIn]);
  
  // Sign in function that redirects to Clerk's sign-in page
  const signIn = (redirectUrl?: string) => {
    try {
      setError(null);
      
      // Using Clerk's built-in sign-in functionality
      if (clerkSignIn) {
        clerk.openSignIn({
          redirectUrl: redirectUrl || '/dashboard',
          afterSignInUrl: '/dashboard',
        });
      } else {
        // Fallback for direct navigation
        window.location.href = '/signin';
      }
    } catch (err) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      toast.error('Sign in failed', {
        description: 'Please try again or create a new account.'
      });
    }
  };
  
  // Sign up function that redirects to Clerk's sign-up page
  const signUp = (redirectUrl?: string) => {
    try {
      setError(null);
      
      // Using Clerk's built-in sign-up functionality
      if (clerkSignUp) {
        clerk.openSignUp({
          redirectUrl: redirectUrl || '/dashboard',
          afterSignUpUrl: '/dashboard',
        });
      } else {
        // Fallback for direct navigation
        window.location.href = '/signup';
      }
    } catch (err) {
      console.error('Sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      toast.error('Sign up failed', {
        description: 'Please try again with a different email address.'
      });
    }
  };
  
  // Sign out function
  const signOut = async (redirectUrl?: string) => {
    try {
      await clerk.signOut();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Sign out error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      toast.error('Sign out failed', {
        description: 'Please try again.'
      });
    }
  };
  
  // Get session token for API calls
  const getToken = async (): Promise<string | null> => {
    try {
      if (!clerk.session) {
        return null;
      }
      return await clerk.session.getToken() || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Function to ensure user is registered in our database
  const ensureUserRegistered = useCallback(async (): Promise<boolean> => {
    if (!userId || !isAuthenticated) return false;
    
    try {
      console.log(`Ensuring user ${userId} is registered in the database...`);
      // Call the validation endpoint to trigger user creation
      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        return false;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me/validate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to validate user registration: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      console.log(`User registration status: ${JSON.stringify(data)}`);
      
      if (data.success && !data.allValid) {
        // If user exists but some data is invalid, we should fix it
        console.log('User exists but some validation failed, ensuring complete registration...');
        
        // Make another call to ensure preferences are created
        const prefsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/users/preferences`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!prefsResponse.ok) {
          console.warn('Could not retrieve or create user preferences');
        } else {
          console.log('User preferences verified or created');
        }
      }
      
      return data.success === true;
    } catch (error) {
      console.error('Error ensuring user registration:', error);
      return false;
    }
  }, [userId, isAuthenticated, getToken]);
  
  // Provide auth context to children
  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        userId,
        user,
        signIn, 
        signUp,
        signOut,
        getToken,
        ensureUserRegistered,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;