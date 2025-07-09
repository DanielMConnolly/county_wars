import React, { useEffect, useState } from 'react';
import { Users, Crown, ArrowRight } from 'lucide-react';
import { useGameState } from './GameStateContext';
import { DataTestIDs } from './DataTestIDs';
import { GamePlayer } from './types/GameTypes';
import { fetchGamePlayers } from './api_calls/HTTPRequests';
import { getCurrentGameId } from './utils/gameUrl';
import { gameSocketService } from './services/gameSocketService';

interface TurnMenuProps {
  className?: string;
}

export const TurnMenu: React.FC<TurnMenuProps> = ({ className = '' }) => {
  const { gameState } = useGameState();
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const gameId = getCurrentGameId()!;
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetchGamePlayers(gameId);
        if (response.success) {
          setPlayers(response.players || []);
        } else {
          console.error('Error fetching players:', response.error);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [gameId]);

  const handleEndTurn = () => {
    // Find next player in rotation
    const currentPlayerIndex = players.findIndex(p => p.userId === gameState.playerWhosTurnItIs);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];
    
    if (nextPlayer) {
      console.log('Advancing turn to:', nextPlayer.username);
      gameSocketService.advanceTurn(nextPlayer.userId);
    }
  };

  const isCurrentPlayersTurn = gameState.playerWhosTurnItIs === currentUserId;

  if (loading) {
    return (
      <div className={`turn-menu-container loading ${className}`}>
        <div className="loading-spinner">Loading players...</div>
        <style>{containerStyles}</style>
      </div>
    );
  }

  return (
    <div className={`turn-menu-container ${className}`} data-testid={DataTestIDs.TURN_MENU}>
      <div className="turn-header">
        <div className="turn-info">
          <Users className="w-4 h-4" />
          <span className="turn-label">Turn {gameState.turnNumber}</span>
        </div>
        
        {isCurrentPlayersTurn && (
          <button 
            onClick={handleEndTurn}
            className="end-turn-button"
            data-testid={DataTestIDs.END_TURN_BUTTON}
          >
            <ArrowRight className="w-4 h-4" />
            End Turn
          </button>
        )}
      </div>

      <div className="players-list">
        {players.map((player) => {
          const isCurrentPlayer = player.userId === gameState.playerWhosTurnItIs;
          const isCurrentUser = player.userId === currentUserId;
          
          return (
            <div
              key={player.userId}
              className={`player-card ${isCurrentPlayer ? 'current-turn' : ''} ${isCurrentUser ? 'current-user' : ''}`}
              data-testid={`${DataTestIDs.PLAYER_CARD}_${player.userId}`}
            >
              <div className="player-name">
                {player.username}
                {isCurrentUser && <span className="you-label">(You)</span>}
              </div>
              
              {isCurrentPlayer && (
                <div className="turn-indicator">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{containerStyles}</style>
    </div>
  );
};

const containerStyles = `
  .turn-menu-container {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #333;
    backdrop-filter: blur(10px);
    max-width: 800px;
  }

  .turn-menu-container.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
  }

  .loading-spinner {
    color: #888;
    font-size: 14px;
  }

  .turn-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .turn-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .turn-label {
    font-size: 16px;
    font-weight: bold;
    color: #fff;
  }

  .end-turn-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.4);
    border-radius: 6px;
    color: #22c55e;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .end-turn-button:hover {
    background: rgba(34, 197, 94, 0.3);
    border-color: rgba(34, 197, 94, 0.6);
    transform: translateY(-1px);
  }

  .end-turn-button:active {
    transform: translateY(0);
  }

  .players-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .player-card {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    transition: all 0.3s ease;
    min-width: 0;
    flex-shrink: 0;
  }

  .player-card.current-turn {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
  }

  .player-card.current-user {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .player-card.current-turn.current-user {
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
  }

  .player-name {
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .you-label {
    font-size: 11px;
    color: #888;
    font-weight: 400;
  }

  .turn-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
  }

  .player-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .player-card.current-turn:hover {
    background: rgba(34, 197, 94, 0.2);
  }

  .player-card.current-user:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  .player-card.current-turn.current-user:hover {
    background: rgba(168, 85, 247, 0.2);
  }
`;