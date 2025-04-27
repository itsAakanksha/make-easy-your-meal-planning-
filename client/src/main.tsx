import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './components/ui/theme-provider'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { AuthProvider } from './hooks/use-auth.tsx'
import App from './App'
import './index.css'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Get Clerk public key from environment variable
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={clerkPubKey}
      signInUrl="/signin"
      signUpUrl="/signup"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      appearance={{
        baseTheme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? dark : undefined,
        elements: {
          formButtonPrimary: 
            'bg-primary text-primary-foreground hover:bg-primary/90',
          card: 'bg-background shadow border rounded-lg',
          formFieldInput: 
            'bg-background text-foreground border-input focus:ring-ring',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
        layout: {
          socialButtonsVariant: 'iconButton',
          socialButtonsPlacement: 'bottom',
          termsPageUrl: 'https://ai-meal-planner.com/terms',
          privacyPageUrl: 'https://ai-meal-planner.com/privacy',
        },
      }}
    >
      <Router>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="system" storageKey="ai-meal-planner-theme">
              <App />
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AuthProvider>
      </Router>
    </ClerkProvider>
  </React.StrictMode>,
)