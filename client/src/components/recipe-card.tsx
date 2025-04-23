import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Info, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  diets?: string[];
  healthScore?: number;
  isSaved?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  onClick: () => void;
  onSaveToggle?: () => void;
}

export function RecipeCard({
  id,
  title,
  image,
  readyInMinutes,
  servings,
  diets = [],
  healthScore,
  isSaved = false,
  isVegetarian = false,
  isVegan = false,
  isGlutenFree = false,
  isDairyFree = false,
  onClick,
  onSaveToggle,
}: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  // Handle save toggle with animation
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onSaveToggle) {
      setIsHeartAnimating(true);
      onSaveToggle();
      
      // Reset animation after it completes
      setTimeout(() => {
        setIsHeartAnimating(false);
      }, 500);
    }
  };

  // Get a display badge for diet type
  const getPrimaryDietBadge = () => {
    if (isVegan) return { label: "Vegan", color: "bg-green-500" };
    if (isVegetarian) return { label: "Vegetarian", color: "bg-emerald-500" };
    if (isGlutenFree) return { label: "Gluten-Free", color: "bg-yellow-500" };
    if (isDairyFree) return { label: "Dairy-Free", color: "bg-blue-500" };
    if (diets && diets.length > 0) {
      return { label: diets[0], color: "bg-purple-500" };
    }
    return null;
  };

  const dietBadge = getPrimaryDietBadge();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        className="group overflow-hidden rounded-xl cursor-pointer h-full flex flex-col bg-white dark:bg-gray-900 border-0 shadow-md hover:shadow-xl transition-shadow duration-300"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={image || "https://placehold.co/600x400/f8fafc/5a67d8?text=No+Image&font=montserrat"}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />

          {/* Diet badge */}
          {dietBadge && (
            <Badge 
              className={`absolute top-3 left-3 ${dietBadge.color} text-white border-0`}
            >
              {dietBadge.label}
            </Badge>
          )}

          {/* Health score - only shown if available */}
          {healthScore && (
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 text-green-700 dark:text-green-400 rounded-full h-9 w-9 flex items-center justify-center text-sm font-bold">
              {healthScore}
            </div>
          )}

          {/* Save/bookmark button */}
          {onSaveToggle && (
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "absolute bottom-3 right-3 rounded-full h-9 w-9 backdrop-blur-sm transition-colors",
                isSaved 
                  ? "bg-rose-500/90 text-white hover:bg-rose-600" 
                  : "bg-white/30 text-white hover:bg-white/50"
              )}
              onClick={handleSaveClick}
            >
              <motion.div
                animate={
                  isHeartAnimating 
                    ? { scale: [1, 1.3, 1] } 
                    : { scale: 1 }
                }
                transition={{ duration: 0.5 }}
              >
                <Heart 
                  className={cn(
                    "h-5 w-5", 
                    isSaved && "fill-white"
                  )} 
                />
              </motion.div>
            </Button>
          )}

          {/* Quick info at the bottom of the image */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center text-white z-10">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {readyInMinutes} min
              </span>
              <span className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {servings}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>

          {/* Diet tags */}
          {diets && diets.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {diets.slice(0, 3).map((diet) => (
                <Badge
                  key={diet}
                  variant="outline"
                  className="text-xs bg-transparent"
                >
                  {diet}
                </Badge>
              ))}
              {diets.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-transparent"
                >
                  +{diets.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Bottom action bar - appears on hover */}
        <div 
          className={cn(
            "border-t py-2 px-4 flex justify-between items-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-xs text-muted-foreground">
            Recipe #{id}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
          >
            View Details <Info className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}