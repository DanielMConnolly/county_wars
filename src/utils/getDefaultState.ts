import { GameState } from '../types/GameTypes';
import { GAME_DEFAULTS } from '../constants/gameDefaults';

export const getDefaultState = (): GameState => {
  return {
    money: GAME_DEFAULTS.STARTING_MONEY,
    selectedCounty: null,
    selectedFranchise: null,
    mapStyle: GAME_DEFAULTS.MAP_STYLE,
    highlightColor: GAME_DEFAULTS.HIGHLIGHT_COLOR,
    currentGameId: null,
    clickedLocation: null,
    franchises: [],
    gameTime: {
      isPaused: false,
      gameDurationHours: GAME_DEFAULTS.GAME_DURATION_HOURS,
      startTime: 0,
    },
  };
};
