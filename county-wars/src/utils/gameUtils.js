"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsCountyOwned = exports.getDifficultyColor = exports.formatNumber = exports.getCost = void 0;
const react_1 = require("react");
const GameStateContext_1 = require("../GameStateContext");
const getCost = (difficulty) => {
    const costs = { Easy: 100, Medium: 250, Hard: 500 };
    return costs[difficulty] || 100;
};
exports.getCost = getCost;
const formatNumber = (num) => {
    return num.toLocaleString();
};
exports.formatNumber = formatNumber;
const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case 'Easy': return 'text-green-400';
        case 'Medium': return 'text-yellow-400';
        case 'Hard': return 'text-red-400';
        default: return 'text-gray-400';
    }
};
exports.getDifficultyColor = getDifficultyColor;
const useIsCountyOwned = (county) => {
    if (!county)
        return false;
    const { gameState } = (0, react_1.useContext)(GameStateContext_1.GameStateContext);
    const { ownedCounties } = gameState;
    const countycode = county.name + county.state;
    return ownedCounties.has(countycode);
};
exports.useIsCountyOwned = useIsCountyOwned;
