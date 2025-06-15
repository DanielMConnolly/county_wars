export type County = {
    name: string,
    pop: number,
    difficulty: number
}

export type GameState = {
    ownedCounties: Set<string>,
    resources: number,
    selectedCounty: County | null,
    mapStyle: string
    highlightColor: string,
    population: number,
}

export type MapControls = {
    zoom: number,
    style: string,
}
