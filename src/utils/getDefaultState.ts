import { GameState } from '../types/GameTypes';
import { GAME_DEFAULTS } from '../constants/gameDefaults';

export const getDefaultState = (): GameState => {
  return {
    money: GAME_DEFAULTS.STARTING_MONEY,
    selectedFranchise: null,
    mapStyle: GAME_DEFAULTS.MAP_STYLE,
    currentGameId: null,
    clickedLocation: null,
    franchises: [],
    userColors: new Map<string, string>(),
    gameTime: {
      isPaused: false,
      gameDurationHours: GAME_DEFAULTS.GAME_DURATION_HOURS,
      startTime: 0,
    },
  };
};
