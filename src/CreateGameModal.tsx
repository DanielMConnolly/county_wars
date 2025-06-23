import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createGame } from './api_calls/CountyWarsHTTPRequests';
import { useAuth } from './auth/AuthContext';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated: (gameId: string) => void;
}

export default function CreateGameModal({ isOpen, onClose, onGameCreated }: CreateGameModalProps) {
  const { user } = useAuth();
  const [gameName, setGameName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !gameName.trim()) return;

    setIsCreating(true);
    try {
      const result = await createGame(gameName.trim(), user.id);
      if (result.success && result.gameId) {
        onGameCreated(result.gameId);
        setGameName('');
        onClose();
      } else {
        alert(result.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setGameName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20
       p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create New Game</h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="gameName" className="block text-sm font-medium text-gray-300 mb-2">
              Game Name
            </label>
            <input
              data-testid="game-name-input"
              type="text"
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white
               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
               transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              data-testid="create-game-submit-button"
              type="submit"
              disabled={isCreating || !gameName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700
               hover:to-green-800 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
