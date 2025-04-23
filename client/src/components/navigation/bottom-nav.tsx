import { Home, Search, Calendar, ShoppingCart, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";

export function BottomNav() {
  const [location] = useLocation();
  const [activeRoute, setActiveRoute] = useState("");

  useEffect(() => {
    setActiveRoute(location);
  }, [location]);

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
    },
    {
      label: "Recipes",
      icon: Search,
      href: "/recipes",
    },
    {
      label: "Meal Plan",
      icon: Calendar,
      href: "/meal-plan",
    },
    {
      label: "Shopping",
      icon: ShoppingCart,
      href: "/shopping-list",
    },
    {
      label: "Account",
      icon: Settings,
      href: "/account",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-1 flex-col items-center justify-center text-xs transition-colors",
            activeRoute === item.href
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          )}
        >
          <item.icon className="mb-1 h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}