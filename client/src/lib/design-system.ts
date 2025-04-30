/**
 * Fresh Vitality Color Theme
 * A vibrant, health-focused color system for the AI Meal Planner application
 */

// Primary Colors
export const colors = {
  // Primary palette
  softGreen: '#7BC47F', // Freshness, health, and nutrition
  warmCoral: '#FF6B6B', // Highlights, actions, encouragement
  eggshellWhite: '#F9F9F9', // Clean background
  
  // Secondary palette
  coolTeal: '#4ABDAC', // AI hints, suggestions, secondary actions
  softMustard: '#FFE156', // Energetic, appetite-enhancing callouts
  
  // Neutrals
  charcoalGray: '#2D2D2D', // Strong typography, accessibility
  ashGray: '#9AA5B1', // Labels, descriptions, light icons
  softGray: '#ECECEC', // Dividers, cards, background contrast
  
  // Semantic colors
  success: '#7BC47F', // Same as softGreen
  warning: '#FFE156', // Same as softMustard
  error: '#FF4242', // Bright red for errors
  info: '#4ABDAC', // Same as coolTeal
};

// Dark mode variations
export const darkModeColors = {
  softGreen: '#65A469',
  warmCoral: '#E55C5C',
  eggshellWhite: '#F9F9F9',
  coolTeal: '#3D9991',
  softMustard: '#D4BC48',
  charcoalGray: '#2D2D2D',
  ashGray: '#828A94',
  softGray: '#3A3A3A',
  background: '#1A1A1A',
  cardBackground: '#252525',
};

// Color application reference
export const colorUsage = {
  // UI Elements
  primaryButton: colors.softGreen,
  secondaryButton: colors.warmCoral,
  aiElements: colors.coolTeal,
  highlights: colors.softMustard,
  
  // Content Types
  nutritionInfo: colors.softGreen,
  calorieTracking: colors.softGreen,
  mealPlanning: colors.warmCoral,
  goals: colors.softMustard,
  recipes: colors.coolTeal,
  
  // Typography
  heading: colors.charcoalGray,
  body: colors.charcoalGray,
  caption: colors.ashGray,
  link: colors.coolTeal,
};

/**
 * Fresh Vitality Color Psychology
 * 
 * - Green (Soft Green): Evokes nature, balance, and health — ideal for food planning
 * - Coral (Warm Coral): Adds warmth, approachability, and a modern feel
 * - Teal (Cool Teal): Represents AI intelligence, trustworthiness, and calmness
 * - Mustard (Soft Mustard): Energetic, appetite-enhancing, creates visual interest
 * - Neutral palette: High contrast with soft neutrals for clean, legible interfaces
 */