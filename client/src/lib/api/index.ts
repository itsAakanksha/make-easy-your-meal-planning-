// Export all services and types
export * from "./types";
export * from "./apiClient";
export { recipeService } from "./recipeService";
export { mealPlanService } from "./mealPlanService";
export { userService } from "./userService";

// Also re-export the default exports for convenience
import apiClient from "./apiClient";
import recipeService from "./recipeService";
import mealPlanService from "./mealPlanService";
import userService from "./userService";

export default {
  apiClient,
  recipeService,
  mealPlanService,
  userService
};