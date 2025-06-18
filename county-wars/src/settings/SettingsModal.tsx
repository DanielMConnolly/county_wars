import React, { useContext } from 'react';
import { X, Palette } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { COLOR_OPTIONS } from '../constants/gameDefaults';
import { GameDurationSettings } from './GameDurationSettings';
import { Dropdown, DropdownOption } from '../components/Dropdown';

export default function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { setHighlightColor, gameState, setGameDuration } = useContext(GameStateContext);
  const [selectedColor, setSelectedColor] = React.useState(gameState.highlightColor);
  const [selectedDuration, setSelectedDuration] = React.useState(gameState.gameTime.gameDurationHours);

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