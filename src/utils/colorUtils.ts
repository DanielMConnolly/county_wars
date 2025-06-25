import { Franchise } from "../types/GameTypes";

// Generate a consistent color for a user based on their userId
export function getUserColor(userId: string): string {
  // Use a simple hash function to generate a consistent color for each user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a color in HSL space for better visual distribution
  const hue = Math.abs(hash) % 360;
  // Use moderate saturation and lightness for good visibility
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Get franchise color based on ownership and user settings
export function getFranchiseColor(
  franchise: Franchise,
  currentUserId: string,
  userHighlightColor: string
): string {
  if (franchise.userId === currentUserId) {
    // User's own franchise - use their selected highlight color
    return userHighlightColor;
  } else {
    // Other user's franchise - use consistent random color based on their userId
    return getUserColor(franchise.userId);
  }
}
