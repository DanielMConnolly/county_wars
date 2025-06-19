import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, Crown } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { fetchAllGames, createGame } from '../api_calls/CountyWarsHTTPRequests';
import { navigateToGame } from '../utils/gameUrl';

interface Game {
  id: string;
  name: string;
  created_at: string;
  created_by_username?: string;
}

interface WelcomeScreenProps {
  onGameSelected: (gameId: string) => void;
}

export default function WelcomeScreen({ onGameSelected }: WelcomeScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');

  useEffect(() => {
    if (activeTab === 'join') {
      loadGames();
    }
  }, [activeTab]);

  const loadGames = async () => {
    setIsLoadingGames(true);
    try {
      const result = await fetchAllGames();
      if (result.success && result.games) {
        setGames(result.games);
      } else {
        console.error('Failed to fetch games:', result.error);
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handleCreateGame = async () => {
    if (!newGameName.trim() || !user) return;

    setIsCreatingGame(true);
    try {
      const result = await createGame(newGameName.trim(), user.id);
      if (result.success && result.gameId) {
        onGameSelected(result.gameId);
        navigateToGame(result.gameId);
      } else {
        alert(result.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreatingGame(false);
      setNewGameName('');
    }
  };

  const handleJoinGame = (gameId: string) => {
    onGameSelected(gameId);
    navigateToGame(gameId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Crown className="w-16 h-16 text-yellow-400 mr-4" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Franchise Wars
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-4">
            Welcome back, <span className="text-blue-400 font-semibold">{user?.username}</span>!
          </p>
          <p className="text-gray-400">
            Choose a game to join or create your own franchise empire
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 px-8 py-6 text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                activeTab === 'join'
                  ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Join Game
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-8 py-6 text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                activeTab === 'create'
                  ? 'bg-green-600/30 text-green-300 border-b-2 border-green-400'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              Create Game
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'join' && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Available Games</h3>
                
                {isLoadingGames ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading games...</p>
                  </div>
                ) : games.length > 0 ? (
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                        onClick={() => handleJoinGame(game.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                              {game.name}
                            </h4>
                            <p className="text-gray-400 text-sm mt-1">
                              Created by {game.created_by_username || 'Unknown'} • {new Date(game.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                              Join
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-xl text-gray-300 mb-2">No games available</p>
                    <p className="text-gray-500">Be the first to create a game!</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Create New Game
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Create New Game</h3>
                
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Game Name
                    </label>
                    <input
                      type="text"
                      value={newGameName}
                      onChange={(e) => setNewGameName(e.target.value)}
                      placeholder="Enter your franchise name..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      disabled={isCreatingGame}
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Choose a unique name for your franchise empire
                    </p>
                  </div>

                  <button
                    onClick={handleCreateGame}
                    disabled={isCreatingGame || !newGameName.trim()}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3"
                  >
                    {isCreatingGame ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Start Your Empire
                      </>
                    )}
                  </button>

                  <div className="mt-8 p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-300 mb-1">Game Features</h4>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• Conquer counties across the map</li>
                          <li>• Build restaurant franchises</li>
                          <li>• Compete with other players</li>
                          <li>• Customize game duration and settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Ready to dominate the franchise world? Choose your path above.
          </p>
        </div>
      </div>
    </div>
  );
}