import React, { ReactNode, useContext, useState } from "react";
import { Settings, UtensilsCrossed, Coins, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SettingsModal from "./settings/SettingsModal";
import GameInformationPanel from "./game_information/GameInformationPanel";
import { GameStateContext } from "./GameStateContext";
import UserMenu from "./auth/UserMenu";
import { useAuth } from "./auth/AuthContext";
import { DataTestIDs } from "./DataTestIDs";

const TopMenu = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameInfoOpen, setIsGameInfoOpen] = useState(false);
  const navigate = useNavigate();

  const {gameState} = useContext(GameStateContext);
  const { user } = useAuth();

  // Filter franchises to show only the current user's franchises
  const userFranchises = gameState.franchises.filter(franchise => 
    user && franchise.userId === user.id
  );

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleGameInfo = () => {
    setIsGameInfoOpen(true);
  };


  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800 to-slate-700
     flex items-center justify-between px-6 z-[1000] shadow-lg border-b border-slate-600">
      <button
        className="text-2xl font-bold text-blue-400
          hover:text-blue-300 transition-colors duration-200"
        onClick={() => navigate('/')}
      >
        Franchise Wars
      </button>

      {/* Stats */}
      <div className="flex gap-8">
        <div          data-testid={DataTestIDs.FRANCHISE_COUNT}>
        <StatItem
          icon={<UtensilsCrossed className="w-5 h-5 text-orange-400" />}
          value={userFranchises.length.toLocaleString()}
          label="Restaurants"
          color="text-orange-400"
        />
        </div>
        <StatItem
          icon={<Coins className="w-5 h-5 text-yellow-400" />}
          value={`$${gameState.money.toLocaleString()}`}
          label="Money"
          color="text-yellow-400"
        />
      </div>

      {/* Menu Buttons */}
      <div className="flex gap-3 items-center">
        <MenuButton
          dataTestID={DataTestIDs.GAME_INFO_BUTTON}
          onClick={handleGameInfo}
          icon={<Info className="w-4 h-4" />}
          text="Game Info"
          className="from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
        />
        <MenuButton
          dataTestID={DataTestIDs.SETTINGS_BUTTON}
          onClick={handleSettings}
          icon={<Settings className="w-4 h-4" />}
          text="Settings"
          className="from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600"
        />

        {/* User Menu - always show since user is authenticated to reach this point */}
        <UserMenu />

        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          isOpen={isSettingsOpen}
        />

        <GameInformationPanel
          onClose={() => setIsGameInfoOpen(false)}
          isOpen={isGameInfoOpen}
        />
      </div>
    </div>
  );
};

const StatItem = ({
  icon,
  value,
  label,
  color,
}: {
  color: string;
  icon: any;
  value: string | number;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    {icon}
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-300">{label}</div>
    </div>
  </div>
);

const MenuButton = ({
  dataTestID,
  onClick,
  icon,
  text,
  className,
}: {
  dataTestID?: DataTestIDs;
  onClick: () => void;
  icon: ReactNode;
  text: string | number;
  className: string;
}) => (
  <button
    data-testid={dataTestID}
    onClick={onClick}
    className={`px-4 py-2 bg-gradient-to-r ${className} rounded-lg transition-all
     duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2`}
  >
    {icon}
    {text}
  </button>
);

export default TopMenu;
