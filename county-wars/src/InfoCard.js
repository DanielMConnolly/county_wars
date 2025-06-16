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
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const gameUtils_1 = require("./utils/gameUtils");
const GameStateContext_1 = require("./GameStateContext");
const InfoCard = ({}) => {
    const { gameState, addCounty } = (0, react_1.useContext)(GameStateContext_1.GameStateContext);
    const { selectedCounty, ownedCounties } = gameState;
    const isCountyOwned = (0, gameUtils_1.useIsCountyOwned)(selectedCounty);
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'text-green-400';
            case 'Medium': return 'text-yellow-400';
            case 'Hard': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };
    const getButtonState = () => {
        if (!selectedCounty)
            return { text: 'Select a Territory', disabled: true };
        if (ownedCounties.has(selectedCounty.name + selectedCounty.state))
            return { text: 'Already Owned', disabled: true };
        return { text: 'Conquer Territory', disabled: false };
    };
    const buttonState = getButtonState();
    return (<div className="fixed bottom-6 right-6 w-80 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm rounded-xl p-6 z-[1000] border border-slate-600 shadow-2xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-600">
        <lucide_react_1.Zap className="w-5 h-5 text-blue-400"/>
        <h3 className="text-xl font-bold text-blue-400">Territory Info</h3>
      </div>

      <div className="space-y-3">
        <InfoRow label="Selected:" value={(selectedCounty === null || selectedCounty === void 0 ? void 0 : selectedCounty.name) || 'None'} className="text-white truncate ml-2"/>

        {selectedCounty && (<>
            <InfoRow label="Population:" value={selectedCounty.pop.toLocaleString()} className="text-blue-300"/>

            <InfoRow label="Status:" value={isCountyOwned ? 'Owned' : 'Neutral'} className={isCountyOwned ? 'text-green-400' : 'text-yellow-400'}/>

            <InfoRow label="Difficulty:" value={selectedCounty.difficulty} className={getDifficultyColor(selectedCounty.difficulty)}/>

            <InfoRow label="Cost:" value={`${(0, gameUtils_1.getCost)(selectedCounty.difficulty)} resources`} className="text-yellow-400"/>
          </>)}
      </div>

      <button onClick={() => {
            if (selectedCounty != null) {
                addCounty(selectedCounty);
            }
        }} disabled={buttonState.disabled} className={`w-full mt-6 px-4 py-3 rounded-lg font-bold transition-all duration-300 ${buttonState.disabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white hover:scale-105 hover:shadow-lg'}`}>
        {buttonState.text}
      </button>
    </div>);
};
const InfoRow = ({ label, value, className }) => (<div className="flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    <span className={`font-semibold ${className}`}>{value}</span>
  </div>);
exports.default = InfoCard;
