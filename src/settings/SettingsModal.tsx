import React, { useContext, useState } from 'react';
import { X, Palette, Plus } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { COLOR_OPTIONS } from '../constants/gameDefaults';
import { GameDurationSettings } from './GameDurationSettings';
import { Dropdown, DropdownOption } from '../components/Dropdown';
import { createGame } from '../api_calls/CountyWarsHTTPRequests';
import { navigateToGame } from '../utils/gameUrl';
import { useAuth } from '../auth/AuthContext';

export default function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { setHighlightColor, gameState, setGameDuration } = useContext(GameStateContext);
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = React.useState(gameState.highlightColor);
  const [selectedDuration, setSelectedDuration] = React.useState(gameState.gameTime.gameDurationHours);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [gameName, setGameName] = useState('');
  const [showNewGameForm, setShowNewGameForm] = useState(false);

  const colorOptions: DropdownOption[] = COLOR_OPTIONS.map(color => ({
    value: color.value,
    label: color.name,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Conquest Color</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the color that will represent your conquered counties on the map.
            </p>

            {/* Color Dropdown */}
            <div>
              <Dropdown
                value={selectedColor}
                onChange={(value) => setSelectedColor(value as string)}
                options={colorOptions}
                label="County Highlight Color"
                icon={<Palette size={16} />}
                renderPreview={(value) => (
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: value as string }}
                  />
                )}
              />
              
              {/* Selected Color Preview */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-sm text-gray-700">
                    Selected: {COLOR_OPTIONS.find(c => c.value === selectedColor)?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Controls Section */}
          <GameDurationSettings 
            selectedDuration={selectedDuration}
            onDurationChange={setSelectedDuration}
          />

          {/* New Game Section */}
          <div className="mb-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Game Management</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a new game where counties are claimed within a specific game context.
            </p>
            
            {!showNewGameForm ? (
              <button
                onClick={() => setShowNewGameForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus size={16} />
                New Game
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  disabled={isCreatingGame}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!gameName.trim()) {
                        alert('Please enter a game name');
                        return;
                      }
                      
                      if (!user) {
                        alert('You must be logged in to create a game');
                        return;
                      }

                      setIsCreatingGame(true);
                      try {
                        const result = await createGame(gameName.trim(), user.id);
                        if (result.success && result.gameId) {
                          console.log('Game created successfully:', result.gameId);
                          navigateToGame(result.gameId);
                          onClose();
                        } else {
                          alert(result.error || 'Failed to create game');
                        }
                      } catch (error) {
                        console.error('Error creating game:', error);
                        alert('Failed to create game. Please try again.');
                      } finally {
                        setIsCreatingGame(false);
                        setShowNewGameForm(false);
                        setGameName('');
                      }
                    }}
                    disabled={isCreatingGame || !gameName.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isCreatingGame ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewGameForm(false);
                      setGameName('');
                    }}
                    disabled={isCreatingGame}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setHighlightColor(selectedColor);
              if (selectedDuration !== gameState.gameTime.gameDurationHours) {
                setGameDuration(selectedDuration);
              }
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}