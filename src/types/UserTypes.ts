// Shared user type definitions

// Complete user type (server-side)
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  created_at?: string;
  last_active?: string;
  highlight_color?: string;
  game_time?: string;
}

// Public user type (client-side, excludes sensitive data)
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  last_active?: string;
  highlight_color?: string;
  game_time?: string;
}

// Helper type to remove password from User
export type SafeUser = Omit<User, 'password_hash'>;