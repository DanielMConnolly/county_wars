import { getMonthAndYear } from './useGetMonthAndYear';
import { GAME_DEFAULTS } from '../constants/GAMEDEFAULTS';

/**
 * Converts elapsed game time (in milliseconds) to a readable game date string
 * @param elapsedTime - Elapsed time in milliseconds since game start
 * @param gameDurationHours - Total game duration in hours (defaults to 1 hour)
 * @returns Formatted date string (e.g., "January 1947")
 */
export const elapsedTimeToGameDate = (
  elapsedTime: number, 
  gameDurationHours: number = GAME_DEFAULTS.GAME_DURATION_HOURS
): string => {
  const gameTime = {
    elapsedTime,
    gameDurationHours,
    isPaused: false,
    startTime: 0
  };

  const { month, year } = getMonthAndYear(gameTime);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${monthNames[month - 1]} ${year}`;
};

/**
 * Converts elapsed game time to a short date format
 * @param elapsedTime - Elapsed time in milliseconds since game start
 * @param gameDurationHours - Total game duration in hours (defaults to 1 hour)
 * @returns Short date string (e.g., "Jan '47")
 */
export const elapsedTimeToShortGameDate = (
  elapsedTime: number, 
  gameDurationHours: number = GAME_DEFAULTS.GAME_DURATION_HOURS
): string => {
  const gameTime = {
    elapsedTime,
    gameDurationHours,
    isPaused: false,
    startTime: 0
  };

  const { month, year } = getMonthAndYear(gameTime);

  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const shortYear = year.toString().slice(-2);
  return `${shortMonthNames[month - 1]} '${shortYear}`;
};