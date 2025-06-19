import React, { useState, useEffect, useContext } from 'react';
import { Plus, Users, Settings, Crown } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { fetchAllGames, createGame } from '../api_calls/CountyWarsHTTPRequests';
import { GameStateContext } from '../GameStateContext';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../auth/UserMenu';

interface Game {
  id: string;
  name: string;
  created_at: string;
  created_by_username?: string;
}


export default function WelcomeScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const navigate = useNavigate();

  const {setCurrentGame} = useContext(GameStateContext);

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
        setCurrentGame(result.gameId);
        navigate(`/game/${result.gameId}`);
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
    setCurrentGame(gameId);
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900
     to-slate-900 flex flex-col">
      {/* Top Menu Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800
        to-slate-700 flex items-center justify-between px-6 z-[1000] shadow-lg
        border-b border-slate-600">
        <div className="text-2xl font-bold text-blue-400">
          Franchise Wars
        </div>
        <UserMenu />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Crown className="w-16 h-16 text-yellow-400 mr-4" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400
             to-purple-400 bg-clip-text text-transparent">
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20
         overflow-hidden">
          {/* Content */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Available Games</h3>
              <button
                onClick={handleCreateGame}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700
                 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg
                  transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Game
              </button>
            </div>

            {isLoadingGames ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400
                 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading games...</p>
              </div>
            ) : games.length > 0 ? (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10
                     transition-all duration-300 cursor-pointer group"
                    onClick={() => handleJoinGame(game.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-blue-300
                         transition-colors">
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
                  onClick={handleCreateGame}
                  className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg
                   font-medium transition-colors"
                >
                  Create New Game
                </button>
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
    </div>
  );
}
