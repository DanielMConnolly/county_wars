import { GameState } from '../types/GameTypes';
import { GAME_DEFAULTS } from '../constants/gameDefaults';

export const getDefaultState = (): GameState => {
  return {
    ownedCounties: new Set<string>(),
    money: GAME_DEFAULTS.STARTING_MONEY,
    selectedCounty: null,
    mapStyle: GAME_DEFAULTS.MAP_STYLE,
    restaurants: GAME_DEFAULTS.RESTAURANTS,
    highlightColor: GAME_DEFAULTS.HIGHLIGHT_COLOR,
    gameTime: {
      year: GAME_DEFAULTS.START_YEAR,
      month: GAME_DEFAULTS.START_MONTH,
      isPaused: false,
      gameDurationHours: GAME_DEFAULTS.GAME_DURATION_HOURS,
      startTime: Date.now(),
    },
  };
};