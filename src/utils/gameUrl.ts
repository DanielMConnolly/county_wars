// URL utilities for game routing

export const getGameIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/game\/([a-zA-Z0-9_]+)$/);
  return match ? match[1] : null;
};

export const navigateToGame = (gameId: string) => {
  const newUrl = `/game/${gameId}`;
  window.history.pushState({ gameId }, '', newUrl);
  // Dispatch a custom event to notify components of URL change
  window.dispatchEvent(new CustomEvent('gameNavigate', { detail: { gameId } }));
};

export const navigateToHome = () => {
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new CustomEvent('gameNavigate', { detail: { gameId: null } }));
};

export const getCurrentGameId = (): string => {
  const gameId = getGameIdFromUrl();
  if (gameId) {
    return gameId;
  }
  // Return default game ID if no game is specified in URL
  return 'default-game';
};