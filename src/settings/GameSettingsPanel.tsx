import React, { useContext, useState } from 'react';
import { Palette } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { COLOR_OPTIONS } from '../constants/GAMEDEFAULTS';
import { GameDurationSettings } from './GameDurationSettings';
import { Dropdown, DropdownOption } from '../components/Dropdown';
import { DataTestIDs } from '../DataTestIDs';

interface GameSettingsPanelProps {
  selectedDuration: number;
  setSelectedDuration: (duration: number) => void;
  onBack: () => void;
  onSave: () => void;
}

export function GameSettingsPanel({
  selectedDuration,
  setSelectedDuration,
  onBack,
  onSave,
}: GameSettingsPanelProps) {
  const colorOptions: DropdownOption[] = COLOR_OPTIONS.map(color => ({
    value: color.value,
    label: color.name,
  }));

  const { gameState, setHighlightColor } = useContext(GameStateContext);

  const [selectedColor, setSelectedColor] = useState<string>(gameState.highlightColor);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Conquest Color</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose the color that will represent your conquered counties on the map.
        </p>

        <div>
          <Dropdown
            dataTestID={DataTestIDs.SETTINGS_COLOR_SELECTOR}
            value={selectedColor}
            onChange={(value) => setSelectedColor(value as string)}
            options={colorOptions}
            label="County Highlight Color"
            icon={<Palette size={16} />}
            renderPreview={(value) => (
              <div
                data-testID={DataTestIDs.SETTINGS_COLOR_SELECTOR_OPTION}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: value as string }}
              />
            )}
          />

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

      <GameDurationSettings
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
      />

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700
           rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          data-testid={DataTestIDs.GAME_SETTINGS_BUTTON_SAVE}
          onClick={
            () => {
              onSave();
              setHighlightColor(selectedColor);
            }}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg
           hover:bg-blue-700 transition-colors font-medium"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
