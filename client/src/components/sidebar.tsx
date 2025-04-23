"use client";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ChefHat, LayoutDashboard, LogOut, PlusCircle, ShoppingCart, User, CalendarCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  
  // Function to determine if route is active
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className={cn("pb-12 min-h-screen w-50 bg-white dark:bg-gray-950 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <Link href="/">
            <div className="flex items-center gap-2 mb-8 cursor-pointer">
              <ChefHat className="h-8 w-8 text-green-500" />
              <h2 className="text-lg font-semibold">Nutri Chef</h2>
            </div>
          </Link>
          
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-medium">Aakanksha</h3>
              <p className="text-sm text-muted-foreground">Premium Member</p>
            </div>
           
          </div>
        </div>
        
        <div className="space-y-1 px-3">
          <Link href="/">
            <Button 
              variant={isActive("/") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/meal-plan">
            <Button 
              variant={isActive("/meal-plan") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Meal Planner
            </Button>
          </Link>
          
    
          
          <Link href="/shopping-list">
            <Button 
              variant={isActive("/shopping-list") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Shopping List
            </Button>
          </Link>
          
          <Link href="/account">
            <Button 
              variant={isActive("/account") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <User className="mr-2 h-5 w-5" />
              User Account
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}