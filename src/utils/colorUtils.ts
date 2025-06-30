import { Franchise } from "../types/GameTypes";
import { COLOR_OPTIONS } from "../constants/GAMEDEFAULTS";

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
  franchise: Franchise,
  currentUserId: string,
  userHighlightColor: string,
  allFranchises?: Franchise[]
): string {
  if (franchise.userId === currentUserId) {
    // User's own franchise - use their selected highlight color
    return userHighlightColor;
  } else {
    // For other users, ensure unique colors across all players
    if (allFranchises) {
      // Collect all colors already in use by other players
      const usedColors = new Set<string>();
      usedColors.add(userHighlightColor); // Current user's color is also reserved

      const uniqueUserIds = new Set<string>();
      allFranchises.forEach(f => {
        if (f.userId !== currentUserId && f.userId !== franchise.userId) {
          uniqueUserIds.add(f.userId);
        }
      });

      uniqueUserIds.forEach(uid => {
        usedColors.add(getUserColor(uid));
      });

      return getUserColorUnique(franchise.userId, usedColors);
    } else {
      // Fallback to original behavior if allFranchises not provided
      return getUserColor(franchise.userId);
    }
  }
}
