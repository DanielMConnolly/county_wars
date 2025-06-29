

export const getGameIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const gameMatch = path.match(/^\/game\/([a-zA-Z0-9_]+)$/);
  const lobbyMatch = path.match(/^\/lobby\/([a-zA-Z0-9_]+)$/);
  return gameMatch ? gameMatch[1] : (lobbyMatch ? lobbyMatch[1] : null);
};


export const navigateToHome = () => {
  window.history.pushState({}, '', '/');
};

export const getCurrentGameId = (): string | null => {
  const gameId = getGameIdFromUrl();
  if (gameId) {
    return gameId;
  }
  // Return default game ID if no game is specified in URL
  return null;
};
