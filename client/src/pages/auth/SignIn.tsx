import { useNavigate } from 'react-router-dom'
import { SignIn } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { useTheme } from '../../components/ui/theme-provider'

const SignInPage = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
    <div className="w-full max-w-md mx-auto">
      <SignIn 
        appearance={{
          baseTheme: isDark ? dark : undefined,
          elements: {
            formButtonPrimary: 
              'bg-primary text-primary-foreground hover:bg-primary/90',
            card: 'bg-transparent shadow-none',
            headerTitle: 'text-2xl font-semibold tracking-tight',
            headerSubtitle: 'text-sm text-muted-foreground',
            formFieldLabel: 'text-foreground',
            formFieldInput: 
              'bg-background text-foreground border-input focus:ring-ring',
            footerActionLink: 'text-primary hover:text-primary/90',
            identityPreviewText: 'text-foreground',
            identityPreviewEditButton: 'text-primary hover:text-primary/90',
          },
        }}
        signUpUrl="/signup"
        redirectUrl="/dashboard"
        afterSignInUrl="/dashboard"
      />
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>If you encounter any issues during sign in, please try refreshing the page.</p>
        <p className="mt-2">Don't have an account yet? <a href="/signup" className="text-primary hover:underline">Sign up here</a></p>
      </div>
    </div>
  )
}

export default SignInPage