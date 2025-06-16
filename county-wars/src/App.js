"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const useMapControls_1 = __importDefault(require("./useMapControls"));
const GameMap_tsx_1 = __importDefault(require("./GameMap.tsx"));
const InfoCard_1 = __importDefault(require("./InfoCard"));
const TopMenu_1 = __importDefault(require("./TopMenu"));
const MapControls_1 = __importDefault(require("./MapControls"));
const react_1 = __importDefault(require("react"));
const GameStateProvider_react_tsx_1 = require("./GameStateProvider.react.tsx");
const App = () => {
    const { mapControls, changeMapStyle, updateZoom, toggleMapStyle } = (0, useMapControls_1.default)();
    return (<div className="h-screen bg-gray-900 text-white overflow-hidden">
      <GameStateProvider_react_tsx_1.GameStateProvider>
      <TopMenu_1.default onToggleMapStyle={toggleMapStyle}/>

      <MapControls_1.default mapControls={mapControls} onChangeMapStyle={changeMapStyle} onUpdateZoom={updateZoom}/>

      <GameMap_tsx_1.default mapControls={mapControls}/>

      <InfoCard_1.default />
       </GameStateProvider_react_tsx_1.GameStateProvider>
    </div>);
};
exports.default = App;
