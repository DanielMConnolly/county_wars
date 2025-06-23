import React from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { useGameState } from '../GameStateContext';
import { Dropdown, DropdownOption } from '../components/Dropdown';

interface GameDurationSettingsProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

export const GameDurationSettings: React.FC<GameDurationSettingsProps> = ({
  selectedDuration,
  onDurationChange,
}) => {
  const { gameState, pauseTime, resumeTime } = useGameState();

  const durationOptions: DropdownOption[] = [
    { value: 5/60, label: '5 minutes' },
    { value: 0.25, label: '15 minutes' },
    { value: 0.5, label: '30 minutes' },
    { value: 1, label: '1 hour' },
    { value: 2, label: '2 hours' },
    { value: 4, label: '4 hours' },
    { value: 8, label: '8 hours' },
    { value: 24, label: '24 hours' },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Time Controls</h3>

      {/* Pause/Resume Button */}
      <div className="mb-4">
        <button
          onClick={gameState.gameTime.isPaused ? resumeTime : pauseTime}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            gameState.gameTime.isPaused
              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          {gameState.gameTime.isPaused ? (
            <>
              <Play size={16} />
              Resume Timeline
            </>
          ) : (
            <>
              <Pause size={16} />
              Pause Timeline
            </>
          )}
        </button>
      </div>

      {/* Game Duration Setting */}
      <div>
        <p className="text-sm text-gray-600 mb-3">
          How long it takes for the timeline to progress from 1945 to 2025.
        </p>
        <Dropdown
          value={selectedDuration}
          onChange={(value) => onDurationChange(Number(value))}
          options={durationOptions}
          label="Game Duration (Real Time)"
          icon={<Clock size={16} />}
        />
        <p className="text-xs text-gray-500 mt-1">
           Progress will reset when duration changes
        </p>
      </div>
    </div>
  );
};
