import { GAME_DEFAULTS } from '../constants/gameDefaults';

/**
 * Gets the appropriate server URL based on the environment
 * @param namespace - Optional socket namespace (e.g., '/game', '/lobby')
 * @returns The complete server URL with namespace
 */
export function getServerURL(namespace?: string): string {
  const baseURL = process.env.NODE_ENV === 'production' 
    ? `${window.location.protocol}//${window.location.host}`
    : GAME_DEFAULTS.LOCALHOST_URL;
  
  return namespace ? `${baseURL}${namespace}` : baseURL;
}