import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth.tsx'
import { UserButton } from '@clerk/clerk-react'
import { 
  Home, 
  CalendarDays, 
  BookOpen, 
  ShoppingCart, 
  Settings,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { ModeToggle } from './ModeToggle'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '../ui/separator'

export const Sidebar = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const isMobile = useMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  // Desktop sidebar with collapsible functionality
  const DesktopSidebar = () => (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      {/* Sidebar Header with Logo */}
      <div className="flex h-16 items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className={cn(
            "font-semibold text-lg transition-opacity duration-200",
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            AI Meal Planner
          </span>
        </Link>
      </div>

      <Separator />

      {/* Navigation Links */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => {
            const isActive = isActivePath(item.href);
            
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent/50",
                        isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className={cn(
                        "transition-all duration-200",
                        isCollapsed ? "opacity-0 w-0" : "opacity-100"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Theme Toggle and User */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <ModeToggle />
          {isAuthenticated && (
            <div className={cn(!isCollapsed ? "ml-auto" : "")}>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );

  // Mobile sidebar using Sheet component
  const MobileSidebar = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed left-4 top-3 z-40 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[270px] p-0">
        <div className="flex h-full flex-col">
          {/* Mobile Header with Logo */}
          <div className="flex h-16 items-center border-b px-4">
            <Link to="/" className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">AI Meal Planner</span>
            </Link>
          </div>

          {/* Mobile Navigation Links */}
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {navItems.map((item) => {
                const isActive = isActivePath(item.href);
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-all",
                      isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Footer with Theme Toggle and User */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <ModeToggle />
              {isAuthenticated && (
                <UserButton afterSignOutUrl="/" />
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
    </>
  );
};