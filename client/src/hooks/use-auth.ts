// import { useContext, createContext } from 'react';
// import { 
//   useAuth as useClerkAuth,
//   useUser,
//   useClerk
// } from '@clerk/clerk-react';

// // Auth context type with improved typing
// interface AuthContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   userId: string | null;
//   user: ReturnType<typeof useUser>['user'];
//   signIn: (redirectUrl?: string) => void;
//   signUp: (redirectUrl?: string) => void;
//   signOut: (redirectUrl?: string) => Promise<void>;
//   getToken: () => Promise<string | null>;
// }

// // Create auth context with default values
// const AuthContext = createContext<AuthContextType | null>(null);

// // Auth provider props
// interface AuthProviderProps {
//   children: React.ReactNode;
// }

// // Auth Provider component
// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   // Use Clerk's built-in hooks
//   const { isLoaded, isSignedIn } = useClerkAuth();
//   const { user } = useUser();
//   const clerk = useClerk();
  
//   // Check if authenticated
//   const isAuthenticated = isSignedIn === true;
//   const isLoading = !isLoaded;
//   const userId = user?.id || null;
  
//   // Sign in function that redirects to Clerk's sign-in page
//   const signIn = (redirectUrl?: string) => {
//     clerk.openSignIn({ redirectUrl });
//   };
  
//   // Sign up function that redirects to Clerk's sign-up page
//   const signUp = (redirectUrl?: string) => {
//     clerk.openSignUp({ redirectUrl });
//   };
  
//   // Sign out function
//   const signOut = async (redirectUrl?: string) => {
//     if (clerk.session) {
//       await clerk.signOut();
//       if (redirectUrl) {
//         window.location.href = redirectUrl;
//       }
//     }
//   };
  
//   // Get session token for API calls
//   const getToken = async (): Promise<string | null> => {
//     try {
//       if (!clerk.session) {
//         return null;
//       }
//       return await clerk.session.getToken() || null;
//     } catch (error) {
//       console.error('Error getting token:', error);
//       return null;
//     }
//   };
  
//   // Provide auth context to children
//   return (
//     <AuthContext.Provider 
//       value={{ 
//         isAuthenticated, 
//         isLoading, 
//         userId,
//         user,
//         signIn, 
//         signUp,
//         signOut,
//         getToken
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use the auth context
// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (context === null) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export default useAuth;