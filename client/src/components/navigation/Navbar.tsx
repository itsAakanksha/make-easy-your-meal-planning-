import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth.tsx'
import { UserButton } from '@clerk/clerk-react'
import { 
  Home, 
  CalendarDays, 
  BookOpen, 
  ShoppingCart, 
  Settings,
  Menu,
  X,
  ChefHat // Added chef hat icon for logo
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { ModeToggle } from './ModeToggle'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile' // Import hook to detect mobile viewport

export const Navbar = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useMobile()

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMenuOpen, isMobile])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/meal-plan', label: 'Meal Plan', icon: CalendarDays },
    { href: '/recipes', label: 'Recipes', icon: BookOpen },
    { href: '/shopping-list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/preferences', label: 'Preferences', icon: Settings },
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="hidden font-bold sm:inline-block">AI Meal Planner</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated && navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                isActivePath(item.href) 
                  ? "text-primary border-b-2 border-primary pb-1" 
                  : "text-muted-foreground"
              )}
              aria-current={isActivePath(item.href) ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {isAuthenticated && (
            <UserButton afterSignOutUrl="/" />
          )}
          
          {/* Mobile Menu Button - Improved accessibility */}
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation - Improved with slide-in animation and better spacing */}
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur md:hidden animate-in slide-in-from-right"
        >
          <nav className="container grid gap-1 p-4">
            {isAuthenticated && navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 rounded-md p-4 text-base transition-colors",
                  isActivePath(item.href) 
                    ? "bg-accent text-accent-foreground font-medium" 
                    : "text-foreground hover:bg-accent/50"
                )}
                aria-current={isActivePath(item.href) ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile menu footer */}
          <div className="container mt-auto p-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Make mealtime easier with AI-powered planning
            </p>
          </div>
        </div>
      )}
    </header>
  )
}