import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string in a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  // Format the date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format a date string with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  // Format the date with time
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

/**
 * Format a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  } else {
    return formatDate(dateString);
  }
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Truncate a string to a specified length and add ellipsis
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Slugify a string for use in URLs
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Fetch a relevant food image for a recipe based on its title
 * @param title Recipe title to search for
 * @returns URL to an image of the food
 */
export async function getFoodImage(title: string): Promise<string> {
  // First try: Search for the specific dish
  try {
    // Remove any text in parentheses for better search results
    const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
    
    // Use Unsplash API - this would normally require an API key
    const response = await fetch(`https://source.unsplash.com/featured/?food,${encodeURIComponent(cleanTitle)}`);
    
    // If successful, return the redirected URL which contains the image
    if (response.ok) {
      return response.url;
    }
  } catch (error) {
    console.error('Error fetching food image:', error);
  }
  
  // Second fallback: Use Foodish API which returns random food images
  try {
    const response = await fetch('https://foodish-api.herokuapp.com/api/');
    const data = await response.json();
    if (data && data.image) {
      return data.image;
    }
  } catch (error) {
    console.error('Error fetching from fallback API:', error);
  }
  
  // Final fallback: Use category-based images for common meal types
  const keywords = title.toLowerCase();
  
  if (keywords.includes('breakfast') || 
      keywords.includes('pancake') || 
      keywords.includes('egg') || 
      keywords.includes('toast')) {
    return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('salad') || 
      keywords.includes('vegetable') || 
      keywords.includes('vegan')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('soup') || 
      keywords.includes('stew') || 
      keywords.includes('broth')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('pasta') || 
      keywords.includes('noodle') || 
      keywords.includes('spaghetti')) {
    return 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('chicken') || 
      keywords.includes('meat') || 
      keywords.includes('beef')) {
    return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('dessert') || 
      keywords.includes('cake') || 
      keywords.includes('sweet') ||
      keywords.includes('chocolate')) {
    return 'https://images.unsplash.com/photo-1626094309830-abbb0c99da4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('fish') || 
      keywords.includes('seafood') || 
      keywords.includes('salmon')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
  
  if (keywords.includes('sandwich') || 
      keywords.includes('burger')) {
    return 'https://images.unsplash.com/photo-1550317138-10000687a72b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
  }
    
  // Last resort fallback for anything else
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80';
}
