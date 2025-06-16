import React, { useContext, useState } from "react";
import { Settings, RotateCcw, Map, Users, Coins } from "lucide-react";
import SettingsModal from "./SettingsModal";
import { GameStateContext } from "./GameStateContext";

const TopMenu = ( onToggleMapStyle) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  const {gameState, resetGame} = useContext(GameStateContext);
  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 z-[1000] shadow-lg border-b border-slate-600">
      <div className="text-2xl font-bold text-blue-400">County Conquest</div>

      {/* Stats */}
      <div className="flex gap-8">
        <StatItem
          icon={<Map className="w-5 h-5 text-green-400" />}
          value={gameState.ownedCounties.size}
          label="Counties"
          color="text-green-400"
        />
        <StatItem
          icon={<Users className="w-5 h-5 text-blue-400" />}
          value={gameState.population.toLocaleString()}
          label="Population"
          color="text-blue-400"
        />
        <StatItem
          icon={<Coins className="w-5 h-5 text-yellow-400" />}
          value={gameState.resources.toLocaleString()}
          label="Resources"
          color="text-yellow-400"
        />
      </div>

      {/* Menu Buttons */}
      <div className="flex gap-3">
        <MenuButton
          onClick={onToggleMapStyle}
          icon={<Map className="w-4 h-4" />}
          text="Toggle Style"
          className="from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600"
        />
        <MenuButton
          onClick={resetGame}
          icon={<RotateCcw className="w-4 h-4" />}
          text="Reset"
          className="from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600"
        />
        <MenuButton
          onClick={handleSettings}
          icon={<Settings className="w-4 h-4" />}
          text="Settings"
          className="from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600"
        />
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          isOpen={isSettingsOpen}
        />
      </div>
    </div>
  );
};

const StatItem = ({ icon, value, label, color }: {color: string, icon: any, value: any,  label: string}) => (
  <div className="flex items-center gap-2">
    {icon}
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-300">{label}</div>
    </div>
  </div>
);

const MenuButton = ({ onClick, icon, text, className }: {onClick: any, icon: any, text: string, className: string}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-gradient-to-r ${className} rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2`}
  >
    {icon}
    {text}
  </button>
);

export default TopMenu;
