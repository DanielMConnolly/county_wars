
export type PlacedLocation = {
    id: string;
    lat: number;
    long: number;
    name: string;
    userId: string; // Owner of the franchise
    username: string; // Owner's username
    county: string | null;
    state: string | null;
    metroArea: string | null;
    locationType?: PlacementMode; // Type of location: franchise or distribution-center
}

export type Franchise = {
    id: string;
    lat: number;
    long: number;
    name: string;
    userId: string; // Owner of the franchise
    username: string; // Owner's username
    county: string | null;
    state: string | null;
    metroArea: string | null;
    locationType?: PlacementMode; // Type of location: franchise or distribution-center
    population: number; // Population of the area the Franchise servers
}

export type GameState = {
    money: number, // Changed from resources to money (USD)
    selectedLocation: PlacedLocation | null,
    mapStyle: string
    clickedLocation: { lat: number, lng: number } | null,
    locations: PlacedLocation[],
    userColors: Map<string, string>, // Maps userId to assigned color
    turnNumber: number,
    playerWhosTurnItIs: string | null,
}

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MapStyle = 'terrain' | 'satellite' | 'dark' | 'street';
export type BoundaryType = 'counties' | 'states';
export type PlacementMode = 'franchise' | 'distribution-center';
export type MapControls = {
    zoom: number,
    style: MapStyle,
    boundaryType: BoundaryType
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
    isReady?: boolean;
}

export type GamePlayer =  {
    userId: string;
    username: string;
    money: number;
}

export interface ServerGameState {
    turnNumber: number;
    playerWhosTurnItIs: string | null;
    lobbyPlayers: LobbyPlayer[];
}

export interface ClickedLocationData {
    metroAreaName: string;
    state: string;
    county: string;
    franchisePlacementCost: number;
    population: number;
}

export interface GameUpdate {
    name?: string;
    numberOfTurns?: number;
    status?: 'DRAFT' | 'LIVE' | 'FINISHED';
}

export interface Game {
    id: string;
    name: string | null;
    numberOfTurns: number | null;
    status: 'DRAFT' | 'LIVE' | 'FINISHED';
    createdBy: string;
    isActive: boolean;
    turnNumber: number;
    playerWhosTurnItIs: string | null;
    createdAt: Date;
    updatedAt: Date;
}
