"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameState = exports.GameStateContext = void 0;
const react_1 = require("react");
// Create the context
// @ts-ignore
exports.GameStateContext = (0, react_1.createContext)(null);
// Custom hook to use the GameState context
const useGameState = () => {
    const context = (0, react_1.useContext)(exports.GameStateContext);
    if (context === undefined) {
        throw new Error('useGameState must be used within a GameStateProvider');
    }
    return context;
};
exports.useGameState = useGameState;
