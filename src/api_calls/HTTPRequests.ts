import { Franchise, LobbyPlayer, User } from '../types/GameTypes';
import {Game} from '@prisma/client';

const API_BASE_URL = '';  // Use Vite proxy for local development

interface AuthResponse {
  user: User;
  token: string;
}

export async function fetchUserHighlightColor(userId: string): Promise<string> {
  try {
    console.log('Fetching highlight color for userId:', userId);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/highlight-color`);
    console.log('Color HTTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched saved highlight color:', data.color);
      return data.color;
    } else {
      console.error('Color HTTP request failed with status:', response.status);
      return 'red'; // Default color
    }
  } catch (error) {
    console.error('Failed to fetch highlight color:', error);
    return 'red'; // Default color
  }
}

export async function updateUserHighlightColor(userId: string, color: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/highlight-color`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ color }),
    });

    if (!response.ok) {
      console.error('Failed to save highlight color:', response.status);
      return false;
    } else {
      console.log('Highlight color saved successfully:', color);
      return true;
    }
  } catch (error) {
    console.error('Failed to update highlight color:', error);
    return false;
  }
}

export async function fetchGameTime(gameID: string): Promise<number | null> {
  try {
    console.log('Fetching game time for game id: ', gameID);
    const response = await fetch(`${API_BASE_URL}/api/games/${gameID}/game-time`);
    console.log('Game time HTTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched saved game time:', data.gameTime);
      return data.gameTime;
    } else {
      console.error('Game time HTTP request failed with status:', response.status);
      return null; // No saved game time
    }
  } catch (error) {
    console.error('Failed to fetch game time:', error);
    return null;
  }
}

// Money management functions - now with game context
export async function fetchUserGameMoney(userId: string, gameId: string): Promise<number> {
  try {
    console.log('Fetching money for userId:', userId, 'in game:', gameId);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/games/${gameId}/money`);
    console.log('Money HTTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched user game money:', data.money);
      return data.money;
    } else {
      console.error('Money HTTP request failed with status:', response.status);
      return 1000; // Default starting money
    }
  } catch (error) {
    console.error('Failed to fetch user game money:', error);
    return 1000; // Default starting money
  }
}

// Authentication functions
export async function signup(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Signup failed' };
    }
  } catch (error) {
    console.error('Signup request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    console.error('Login request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function verifyToken(
  token: string
): Promise<{ success: boolean; data?: { user: User }; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Token verification failed' };
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function getUserProfile(
  token: string
): Promise<{ success: boolean; data?: { user: User }; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Failed to get user profile' };
    }
  } catch (error) {
    console.error('Get profile request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Game management functions
export async function createGame(createdBy: string):
  Promise<{ success: boolean; gameId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ createdBy }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, gameId: data.gameId };
    } else {
      return { success: false, error: data.error || 'Failed to create game' };
    }
  } catch (error) {
    console.error('Create game request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchGame(gameId: string): Promise<{ success: boolean; game?: Game; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, game: data };
    } else {
      return { success: false, error: data.error || 'Game not found' };
    }
  } catch (error) {
    console.error('Fetch game request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchUserGames(userId: string)
  : Promise<{ success: boolean; games?: Game[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/games`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, games: data.games };
    } else {
      return { success: false, error: data.error || 'Failed to fetch games' };
    }
  } catch (error) {
    console.error('Fetch user games request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchAllGames(): Promise<{ success: boolean; games?: Game[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, games: data.games };
    } else {
      return { success: false, error: data.error || 'Failed to fetch games' };
    }
  } catch (error) {
    console.error('Fetch all games request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchDraftGames(): Promise<{ success: boolean; games?: Game[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games?status=DRAFT`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, games: data.games };
    } else {
      return { success: false, error: data.error || 'Failed to fetch draft games' };
    }
  } catch (error) {
    console.error('Fetch draft games request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchUserLiveGames(userId: string): Promise<{ success: boolean; games?: Game[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/live-games`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, games: data.games };
    } else {
      return { success: false, error: data.error || 'Failed to fetch user live games' };
    }
  } catch (error) {
    console.error('Fetch user live games request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function deleteGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Failed to delete game' };
    }
  } catch (error) {
    console.error('Delete game request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function startGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Failed to start game' };
    }
  } catch (error) {
    console.error('Start game request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchGameState(gameId: string): Promise<{
  success: boolean;
  gameState?: { elapsedTime: number; isPaused: boolean };
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/state`);
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        gameState: {
          elapsedTime: data.elapsedTime,
          isPaused: data.isPaused
        }
      };
    } else {
      return { success: false, error: data.error || 'Failed to fetch game state' };
    }
  } catch (error) {
    console.error('Fetch game state request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchLobbyState(gameId: string, userId: string): Promise<{
  success: boolean;
  players?: LobbyPlayer[];
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/lobby?userId=${encodeURIComponent(userId)}`);
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        players: data.players
      };
    } else {
      return { success: false, error: data.error || 'Failed to fetch lobby state' };
    }
  } catch (error) {
    console.error('Fetch lobby state request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Franchise management functions
export async function placeFranchise(
  userId: string,
  gameId: string,
  lat: number,
  long: number,
  name: string,
  countyName?: string,
  elapsedTime?: number
): Promise<{ success: boolean; error?: string; cost?: number; remainingMoney?: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/franchises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, gameId, lat, long, name, countyName, elapsedTime }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        cost: data.cost,
        remainingMoney: data.remainingMoney
      };
    } else {
      return { success: false, error: data.error || 'Failed to place franchise' };
    }
  } catch (error) {
    console.error('Place franchise request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}


export async function getGameFranchises(
  gameId: string
): Promise<{ success: boolean; franchises?: Franchise[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/franchises`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, franchises: data.franchises};
    } else {
      return { success: false, error: data.error || 'Failed to fetch game franchises' };
    }
  } catch (error) {
    console.error('Fetch game franchises request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function removeFranchise(
  franchiseId: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/franchises/${franchiseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Failed to remove franchise' };
    }
  } catch (error) {
    console.error('Remove franchise request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Export User type for use in other files
export type { User };
