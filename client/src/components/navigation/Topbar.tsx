import { useAuth } from '@/hooks/use-auth.tsx'
import { UserButton } from '@clerk/clerk-react'
import { ChefHat} from 'lucide-react'
import { ModeToggle } from './ModeToggle'
import { Link } from 'react-router-dom'

export const Topbar = () => {
  const { isAuthenticated } = useAuth()
  
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Meal Planner</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Page title or breadcrumbs could go here */}
          <div className="flex-1" />
          
          <ModeToggle />
          
          {isAuthenticated && (
            <UserButton afterSignOutUrl="/" />
          )}
        </div>
      </div>
    </header>
  )
}