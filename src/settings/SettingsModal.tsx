import React, { useContext, useState, useEffect } from 'react';
import { X, Settings, Users, RotateCcw } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { GameSettingsPanel } from './GameSettingsPanel';
import { fetchAllGames } from '../api_calls/CountyWarsHTTPRequests';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DataTestIDs } from '../DataTestIDs';

type ModalView = 'main' | 'gameSettings' | 'joinGame';

export default function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { gameState, setGameDuration, resetGame } = useContext(GameStateContext);
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [selectedDuration, setSelectedDuration] = React.useState(gameState.gameTime.gameDurationHours);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentView === 'joinGame') {
      loadAllGames();
    }
  }, [currentView]);

  const loadAllGames = async () => {
    setIsLoadingGames(true);
    try {
      const result = await fetchAllGames();
      if (result.success && result.games) {
        setAllGames(result.games);
      } else {
        console.error('Failed to fetch all games:', result.error);
        setAllGames([]);
      }
    } catch (error) {
      console.error('Error fetching all games:', error);
      setAllGames([]);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handleModalClose = () => {
    setCurrentView('main');
    onClose();
  };

  const getModalTitle = () => {
    switch (currentView) {
      case 'gameSettings': return 'Game Settings';
      case 'joinGame': return 'Join Game';
      default: return 'Menu';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {currentView !== 'main' && (
              <button
                onClick={() => setCurrentView('main')}
                className="text-gray-500 hover:text-gray-700 transition-colors mr-2"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-800">{getModalTitle()}</h2>
          </div>
          <button
            onClick={handleModalClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {currentView === 'main' && (
            <div className="space-y-4">
              <button
                data-testid={DataTestIDs.GAME_SETTINGS_BUTTON}
                onClick={() => setCurrentView('gameSettings')}
                className="w-full flex items-center gap-3 p-4 border border-gray-200
                rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Settings size={20} className="text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-800">Game Settings</h3>
                  <p className="text-sm text-gray-600">Configure colors, map style, and game duration</p>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('joinGame')}
                className="w-full flex items-center gap-3 p-4 border border-gray-200
                 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Users size={20} className="text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-800">Join Game</h3>
                  <p className="text-sm text-gray-600">Browse and join existing games</p>
                </div>
              </button>

              <button
                onClick={() => {
                  resetGame();
                  handleModalClose();
                }}
                className="w-full flex items-center gap-3 p-4 border border-gray-200
                 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <RotateCcw size={20} className="text-orange-600" />
                <div>
                  <h3 className="font-medium text-gray-800">Reset Game</h3>
                  <p className="text-sm text-gray-600">Reset the current game progress</p>
                </div>
              </button>
            </div>
          )}

          {currentView === 'gameSettings' && (
            <GameSettingsPanel
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              onBack={() => setCurrentView('main')}
              onSave={() => {
                if (selectedDuration !== gameState.gameTime.gameDurationHours) {
                  setGameDuration(selectedDuration);
                }
                handleModalClose();
              }}
            />
          )}

          {currentView === 'joinGame' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Browse and join any existing game.
              </p>

              {isLoadingGames ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2
                   border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading games...</p>
                </div>
              ) : allGames.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allGames.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        navigate(`/game/${game.id}`);
                        handleModalClose();
                      }}
                      className="w-full p-3 text-left border border-gray-200
                       rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{game.name}</div>
                      <div className="text-sm text-gray-600">
                        Created: {new Date(game.created_at).toLocaleDateString()} by {game.created_by_username || 'Unknown'}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No games found</p>
                  <p className="text-sm text-gray-500 mt-1">Create a new game to get started</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentView('main')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700
                   rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
