import {
  Franchise,
  LobbyPlayer,
  User,
  ClickedLocationData,
  GamePlayer,
  PlacementMode,
  Game,
} from '../types/GameTypes';

const API_BASE_URL = ''; // Use Vite proxy for local development

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

export async function fetchMetroAreaName(lat: number, lng: number): Promise<string> {
  try {
    console.log('Fetching metro area name for lat:', lat, 'lng:', lng);
    const response = await fetch(`${API_BASE_URL}/api/metro-area?lat=${lat}&lng=${lng}`);
    console.log('RESPONSE: ', response);
    if (response.ok) {
      const data = await response.json();
      console.log('Fetched metro area name:', data);
      return data.metro_area ?? 'Unknown';
    }
    return 'Unknown';
  } catch (error) {
    console.error('Failed to fetch metro area name:', error);
    return 'Unknown';
  }
}

export async function fetchClickedLocationData(
  lat: number,
  lng: number
): Promise<ClickedLocationData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clicked-location-data?lat=${lat}&lng=${lng}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      metroAreaName: data.metroAreaName,
      franchisePlacementCost: data.franchisePlacementCost ?? 100,
      population: data.population ?? 0,
      state: data.state,
      county: data.county,
    };
  } catch (error) {
    console.error('Failed to fetch clicked location data:', error);
    return null;
  }
}

export async function fetchDistributionCenterCost(
  gameId: string,
  userId: string
): Promise<{
  cost: number;
  isFirstDistributionCenter: boolean;
  existingDistributionCenters: number;
} | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/games/${gameId}/distribution-center-cost?userId=${encodeURIComponent(userId)}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      cost: data.cost,
      isFirstDistributionCenter: data.isFirstDistributionCenter,
      existingDistributionCenters: data.existingDistributionCenters,
    };
  } catch (error) {
    console.error('Failed to fetch distribution center cost:', error);
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
export async function createGame(
  createdBy: string
): Promise<{ success: boolean; gameId?: string; error?: string }> {
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

export async function fetchGame(
  gameId: string
): Promise<{ success: boolean; game?: Game; error?: string }> {
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

export async function fetchUserGames(
  userId: string
): Promise<{ success: boolean; games?: Game[]; error?: string }> {
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

export async function fetchDraftGames(): Promise<{
  success: boolean;
  games?: Game[];
  error?: string;
}> {
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

export async function fetchUserLiveGames(
  userId: string
): Promise<{ success: boolean; games?: Game[]; error?: string }> {
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

export async function fetchGameState(gameId: string): Promise<{
  success: boolean;
  gameState?: { elapsedTime: number; isPaused: boolean };
  players?: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/state`);
    const data = await response.json();
    console.log('DATA: ', data);

    if (response.ok) {
      return {
        success: true,
        gameState: {
          elapsedTime: data.elapsedTime,
          isPaused: data.isPaused,
        },
        players: data.players,
      };
    } else {
      return { success: false, error: data.error || 'Failed to fetch game state' };
    }
  } catch (error) {
    console.error('Fetch game state request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchLobbyState(
  gameId: string,
  userId: string
): Promise<{
  success: boolean;
  players?: LobbyPlayer[];
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/games/${gameId}/lobby?userId=${encodeURIComponent(userId)}`
    );
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        players: data.players,
      };
    } else {
      return { success: false, error: data.error || 'Failed to fetch lobby state' };
    }
  } catch (error) {
    console.error('Fetch lobby state request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function placeLocation(
  userId: string,
  gameId: string,
  lat: number,
  long: number,
  name: string,
  locationType: PlacementMode = 'franchise',
  population?: number
): Promise<{ success: boolean; error?: string; cost?: number; remainingMoney?: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/franchises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        gameId,
        lat,
        long,
        name,
        locationType: locationType === 'distribution-center' ? 'distributionCenter' : 'franchise',
        population,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        cost: data.cost,
        remainingMoney: data.remainingMoney,
      };
    } else {
      return { success: false, error: data.error || 'Failed to place franchise' };
    }
  } catch (error) {
    console.error('Place franchise request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function placeDistributionCenter(
  userId: string,
  gameId: string,
  lat: number,
  long: number,
  name: string,
  elapsedTime?: number
): Promise<{ success: boolean; error?: string; cost?: number; remainingMoney?: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/distribution-centers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        gameId,
        lat,
        long,
        name,
        elapsedTime,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        cost: data.cost,
        remainingMoney: data.remainingMoney,
      };
    } else {
      return { success: false, error: data.error || 'Failed to place distribution center' };
    }
  } catch (error) {
    console.error('Place distribution center request failed:', error);
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
      return { success: true, franchises: data.franchises };
    } else {
      return { success: false, error: data.error || 'Failed to fetch game franchises' };
    }
  } catch (error) {
    console.error('Fetch game franchises request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function removeFranchise(
  franchiseId: string,
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

export async function fetchGamePlayers(
  gameId: string
): Promise<{ success: boolean; players?: GamePlayer[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/players`);
    const data = await response.json();
    console.log('DATA: ', data);

    if (response.ok) {
      return { success: true, players: data };
    } else {
      return { success: false, error: data.error || 'Failed to fetch game players' };
    }
  } catch (error) {
    console.error('Fetch game players request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function fetchFranchiseIncome(
  gameId: string,
  userId: string
): Promise<{
  success: boolean;
  franchises?: Array<{ id: string; name: string; income: number }>;
  totalIncome?: number;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/games/${gameId}/users/${userId}/franchise-income`
    );
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        franchises: data.franchises,
        totalIncome: data.totalIncome,
      };
    } else {
      return { success: false, error: data.error || 'Failed to fetch franchise income' };
    }
  } catch (error) {
    console.error('Fetch franchise income request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Export User type for use in other files
export type { User };
