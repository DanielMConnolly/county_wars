

export const getGameIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/game\/([a-zA-Z0-9_]+)$/);
  return match ? match[1] : null;
};


export const navigateToHome = () => {
  window.history.pushState({}, '', '/');
};

export const getCurrentGameId = (): string => {
  const gameId = getGameIdFromUrl();
  if (gameId) {
    return gameId;
  }
  // Return default game ID if no game is specified in URL
  return 'default-game';
};
