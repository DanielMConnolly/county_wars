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
    gameTime: {
      isPaused: false,
      gameDurationHours: GAME_DEFAULTS.GAME_DURATION_HOURS,
      startTime: 0,
    },
    turnNumber: 1,
    playerWhosTurnItIs: null,
  };
};
