import React from 'react';
import { Play, Pause } from 'lucide-react';
import { useGameState } from './GameStateContext';
import { GAME_DEFAULTS } from './constants/GAMEDEFAULTS';
import { DataTestIDs } from './DataTestIDs';
import useGetMonthAndYear from './utils/useGetMonthAndYear';

interface TimelineProps {
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ className = '' }) => {
  const { gameState, pauseTime, resumeTime } = useGameState();

  // Calculate progress as percentage (0-100)
  const startYear = GAME_DEFAULTS.START_YEAR;
  const endYear = GAME_DEFAULTS.END_YEAR;
  const totalYears = endYear - startYear;
  const {month, year} = useGetMonthAndYear();
  // Convert current time to decimal year for more precise progress
  const decimalYear = year + (month - 1) / 12;
  const progress = Math.min(Math.max((decimalYear - startYear) / totalYears * 100, 0), 100);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = monthNames[month - 1] || 'January';

  const handlePlayPauseClick = () => {
    if (gameState.gameTime?.isPaused) {
      resumeTime();
    } else {
      pauseTime();
    }
  };

  return (
    <div className={`timeline-container ${className}`}>
      <div className="timeline-header">
        <button
          data-testid={DataTestIDs.TIMELINE_PLAY_PAUSE_BUTTON}
          className="play-pause-btn"
          onClick={handlePlayPauseClick}
          aria-label={gameState.gameTime?.isPaused ? 'Resume game' : 'Pause game'}
        >
          {gameState.gameTime?.isPaused ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
        </button>
        <div className="time-display" data-testid={DataTestIDs.TIMELINE_TIME_DISPLAY}>
          <span className="month">{currentMonthName}</span>
          <span className="year">{year}</span>
        </div>
        <div className="time-range">
          <span className="start-year">{startYear}</span>
          <span className="end-year">{endYear}</span>
        </div>
      </div>

      <div className="timeline-bar">
        <div className="timeline-track">
          <div
            className="timeline-progress"
            style={{ width: `${progress}%` }}
          />
          <div
            className="timeline-indicator"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <style>{`
        .timeline-container {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
          border: 1px solid #333;
          border-bottom: none;
          min-width: 400px;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .play-pause-btn {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          padding: 8px;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .play-pause-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          transform: scale(1.05);
        }

        .play-pause-btn:active {
          transform: scale(0.95);
        }

        .time-display {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .month {
          font-size: 14px;
          color: #ccc;
          font-weight: 400;
        }

        .year {
          font-size: 20px;
          font-weight: bold;
          color: #fff;
        }

        .time-range {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #888;
        }

        .timeline-bar {
          position: relative;
        }

        .timeline-track {
          height: 6px;
          background: #333;
          border-radius: 3px;
          position: relative;
          overflow: hidden;
        }

        .timeline-progress {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #2196F3);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .timeline-indicator {
          position: absolute;
          top: -2px;
          width: 10px;
          height: 10px;
          background: white;
          border: 2px solid #2196F3;
          border-radius: 50%;
          transform: translateX(-50%);
          transition: left 0.3s ease;
        }

        ${gameState.gameTime?.isPaused ? `
          .timeline-progress {
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        ` : ''}
      `}</style>
    </div>
  );
};
