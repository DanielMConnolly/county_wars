export type County = {
    name: string,
    stateFP: string,
    countyFP: string,
}

export type GameTime = {
    isPaused: boolean;
    gameDurationHours: number; // How long the full timeline takes in real hours
    startTime: number; // Timestamp when game started
    elapsedTime?: number; // How much time has elapsed (for save/restore)
}

export type Franchise = {
    id: string;
    lat: number;
    long: number;
    name: string;
    placedAt: number; // timestamp
    userId: string; // Owner of the franchise
    username: string; // Owner's username
}

export type GameState = {
    money: number, // Changed from resources to money (USD)
    selectedCounty: County | null,
    selectedFranchise: Franchise | null,
    mapStyle: string
    highlightColor: string,
    gameTime: GameTime,
    currentGameId: string | null,
    clickedLocation: { lat: number, lng: number } | null,
    franchises: Franchise[],
}

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MapStyle = 'terrain' | 'satellite' | 'dark' | 'street';
export type MapControls = {
    zoom: number,
    style: MapStyle
}

export interface User {
    id: string;
    username: string;
    email: string;
    created_at?: string;
    last_active?: string;
    highlight_color?: string;
    game_time?: string;
  }

export interface LobbyPlayer {
    userId: string;
    username: string;
    isHost: boolean;
}

export interface ServerGameState {
    elapsedTime: number;
    isGamePaused: boolean;
    lobbyPlayers: LobbyPlayer[];
}
