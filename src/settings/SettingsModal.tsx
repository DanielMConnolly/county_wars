import React, { useContext, useState } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { GameSettingsPanel } from './GameSettingsPanel';
import { DataTestIDs } from '../DataTestIDs';

type ModalView = 'main' | 'gameSettings';

export default function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { gameState, resetGame } = useContext(GameStateContext);
  const [currentView, setCurrentView] = useState<ModalView>('main');


  const handleModalClose = () => {
    setCurrentView('main');
    onClose();
  };

  const getModalTitle = () => {
    switch (currentView) {
      case 'gameSettings': return 'Game Settings';
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
                  <p className="text-sm text-gray-600">Configure colors and map style</p>
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
              onBack={() => setCurrentView('main')}
              onSave={() => {
                handleModalClose();
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}
