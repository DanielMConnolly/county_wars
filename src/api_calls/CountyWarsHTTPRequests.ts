import { GameTime, User } from '../types/GameTypes';

const API_BASE_URL = '';  // Use Vite proxy for local development

interface AuthResponse {
  user: User;
  token: string;
}


export async function fetchUserCounties(userId: string): Promise<string[]> {
  try {
    console.log('Fetching initial counties for userId:', userId);
    const response = await fetch(`${API_BASE_URL}/api/counties/${userId}`);
    console.log('Counties HTTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched initial counties via HTTP:', data.ownedCounties);
      return data.ownedCounties;
    } else {
      console.error('Counties HTTP request failed with status:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch initial counties:', error);
    return [];
  }
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

export async function fetchUserGameTime(userId: string): Promise<GameTime | null> {
  try {
    console.log('Fetching game time for userId:', userId);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/game-time`);
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

export async function updateUserGameTime(userId: string, gameTime: GameTime): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/game-time`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameTime }),
    });

    if (!response.ok) {
      console.error('Failed to save game time:', response.status);
      return false;
    } else {
      console.log('Game time saved successfully:', gameTime);
      return true;
    }
  } catch (error) {
    console.error('Failed to update game time:', error);
    return false;
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

// Export User type for use in other files
export type { User };
