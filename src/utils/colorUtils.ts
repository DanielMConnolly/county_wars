import { COLOR_OPTIONS } from "../constants/gameDefaults";
import { PlacedLocation } from "../types/GameTypes";

// Generate a consistent color for a user based on their userId using predefined colors
export function getUserColor(userId: string): string {
  // Use a simple hash function to generate a consistent color index for each user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to select a color from the predefined options
  const colorIndex = Math.abs(hash) % COLOR_OPTIONS.length;
  return COLOR_OPTIONS[colorIndex].value;
}

// Get unique color for a user, avoiding colors already in use
export function getUserColorUnique(userId: string, usedColors: Set<string>): string {
  // Try the user's default color first
  const defaultColor = getUserColor(userId);
  if (!usedColors.has(defaultColor)) {
    return defaultColor;
  }

  // If the default color is taken, find the first available color
  for (const colorOption of COLOR_OPTIONS) {
    if (!usedColors.has(colorOption.value)) {
      return colorOption.value;
    }
  }

  // If all colors are taken, fall back to the user's default color
  return defaultColor;
}

// Get franchise color based on ownership and user settings
export function getFranchiseColor(
  franchise: PlacedLocation,
  userColors: Map<string, string>,
): string {
  return userColors.get(franchise.userId)?? '';
}
