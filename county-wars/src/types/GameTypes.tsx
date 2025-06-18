export type County = {
    name: string,
    stateFP: string,
    countyFP: string,
}

export type GameTime = {
    year: number;
    month: number;
    isPaused: boolean;
    gameDurationHours: number; // How long the full timeline takes in real hours
    startTime: number; // Timestamp when game started
}

export type GameState = {
    ownedCounties: Set<string>,
    resources: number,
    selectedCounty: County | null,
    mapStyle: string
    highlightColor: string,
    population: number,
    gameTime: GameTime,
}

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MapStyle = 'terrain' | 'satellite' | 'dark' | 'street';
export type MapControls = {
    zoom: number,
    style: MapStyle
}
