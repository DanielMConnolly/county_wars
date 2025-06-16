"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateProvider = void 0;
const react_1 = __importStar(require("react"));
const GameStateContext_1 = require("./GameStateContext");
const GameStateProvider = ({ children, }) => {
    const [gameState, setGameState] = (0, react_1.useState)({
        ownedCounties: new Set(),
        resources: 1000,
        selectedCounty: null,
        mapStyle: "terrain",
        population: 1000,
        highlightColor: "red",
    });
    // Helper function to add a county
    const addCounty = (countyInfo) => {
        setGameState((prevState) => (Object.assign(Object.assign({}, prevState), { ownedCounties: new Set([...prevState.ownedCounties, countyInfo.name + countyInfo.state]) })));
    };
    // Helper function to remove a county
    const removeCounty = (countyId) => {
        setGameState((prevState) => {
            const newOwnedCounties = new Set(prevState.ownedCounties);
            newOwnedCounties.delete(countyId);
            return Object.assign(Object.assign({}, prevState), { ownedCounties: newOwnedCounties });
        });
    };
    // Helper function to update resources
    const updateResources = (amount) => {
        setGameState((prevState) => (Object.assign(Object.assign({}, prevState), { resources: Math.max(0, prevState.resources + amount) })));
    };
    // Helper function to select a county
    const selectCounty = (countyInfo) => {
        setGameState((prevState) => (Object.assign(Object.assign({}, prevState), { selectedCounty: countyInfo })));
    };
    // Helper function to set map style
    const setMapStyle = (style) => {
        setGameState((prevState) => (Object.assign(Object.assign({}, prevState), { mapStyle: style })));
    };
    const resetGame = () => {
        if (window.confirm("Are you sure you want to reset the game?")) {
            setGameState({
                ownedCounties: new Set(),
                resources: 1000,
                selectedCounty: null,
                mapStyle: "terrain",
                highlightColor: "red",
                population: 1000,
            });
        }
    };
    // Helper function to set highlight color
    const setHighlightColor = (color) => {
        setGameState((prevState) => (Object.assign(Object.assign({}, prevState), { highlightColor: color })));
    };
    const contextValue = {
        gameState,
        setGameState,
        addCounty,
        removeCounty,
        updateResources,
        selectCounty,
        setMapStyle,
        setHighlightColor,
        resetGame,
    };
    return (<GameStateContext_1.GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext_1.GameStateContext.Provider>);
};
exports.GameStateProvider = GameStateProvider;
