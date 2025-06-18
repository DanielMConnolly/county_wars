import { GameState } from '../types/GameTypes';
import { GAME_DEFAULTS } from '../constants/gameDefaults';

export const getDefaultState = (): GameState => {
  return {
    ownedCounties: new Set<string>(),
    resources: GAME_DEFAULTS.RESOURCES,
    selectedCounty: null,
    mapStyle: GAME_DEFAULTS.MAP_STYLE,
    population: GAME_DEFAULTS.POPULATION,
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