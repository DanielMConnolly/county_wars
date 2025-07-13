import { GameState } from '../types/GameTypes';
import { GAME_DEFAULTS } from '../constants/gameDefaults';

export const getDefaultState = (): GameState => {
  return {
    money: GAME_DEFAULTS.STARTING_MONEY,
    selectedLocation: null,
    mapStyle: GAME_DEFAULTS.MAP_STYLE,
    clickedLocation: null,
    locations: [],
    userColors: new Map<string, string>(),
    turnNumber: 1,
    playerWhosTurnItIs: null,
    selectedState: null,
  };
};
