import { GameState } from '../types/GameTypes';
import { GAME_DEFAULTS } from '../constants/gameDefaults';

export const getDefaultState = (): GameState => {
  return {
    ownedCounties: new Set<string>(),
    money: GAME_DEFAULTS.STARTING_MONEY,
    selectedCounty: null,
    mapStyle: GAME_DEFAULTS.MAP_STYLE,
    highlightColor: GAME_DEFAULTS.HIGHLIGHT_COLOR,
    currentGameId: null,
    clickedLocation: null,
    franchises: [],
    gameTime: {
      year: GAME_DEFAULTS.START_YEAR,
      month: GAME_DEFAULTS.START_MONTH,
      isPaused: false,
      gameDurationHours: GAME_DEFAULTS.GAME_DURATION_HOURS,
      startTime: Date.now(),
    },
  };
};
