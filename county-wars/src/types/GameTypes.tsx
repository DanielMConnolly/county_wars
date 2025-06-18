export type County = {
    name: string,
    stateFP: string,
    countyFP: string,
}

export type GameState = {
    ownedCounties: Set<string>,
    resources: number,
    selectedCounty: County | null,
    mapStyle: string
    highlightColor: string,
    population: number,
}

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MapStyle = 'terrain' | 'satellite' | 'dark' | 'street';
export type MapControls = {
    zoom: number,
    style: MapStyle
}
