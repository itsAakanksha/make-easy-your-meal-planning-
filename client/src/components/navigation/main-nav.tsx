import { Link, useLocation } from "wouter";
import { cn } from "../../lib/utils";
import { LayoutDashboard, ChefHat, CalendarCheck, ShoppingCart, User } from "lucide-react";
import { useMobile } from "../../hooks/use-mobile";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function BottomNav() {
  const [location] = useLocation();
  const isMobile = useMobile();
  
  // Hide on desktop
  if (!isMobile) return null;
  
  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      href: "/meal-plan",
      label: "Meal Plan",
      icon: <CalendarCheck className="h-5 w-5" />
    },
    {
      href: "/recipes",
      label: "Recipes",
      icon: <ChefHat className="h-5 w-5" />
    },
    {
      href: "/shopping-list",
      label: "Shopping",
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      href: "/account",
      label: "Profile",
      icon: <User className="h-5 w-5" />
    }
  ];

  // Function to determine if route is active
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          className="group flex flex-col items-center"
        >
          <div 
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
              isActive(item.href) 
                ? "text-primary" 
                : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center transform transition-transform", 
              isActive(item.href) ? "scale-110" : "group-hover:scale-110"
            )}>
              {item.icon}
              {isActive(item.href) && (
                <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </div>
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}