import React, { useState, useEffect, useContext } from 'react';
import { Plus, Crown } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { fetchAllGames } from './api_calls/CountyWarsHTTPRequests';
import { GameStateContext } from './GameStateContext';
import { useNavigate } from 'react-router-dom';
import UserMenu from './auth/UserMenu';
import ExistingGamesList from './ExistingGamesList';
import CreateGameModal from './CreateGameModal';

interface Game {
  id: string;
  name: string;
  created_at: string;
  created_by_username?: string;
}


export default function WelcomeScreen() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const { setCurrentGame } = useContext(GameStateContext);

  useEffect(() => {
    loadGames();
  }, []);

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


  const handleGameCreated = (gameId: string) => {
    setCurrentGame(gameId);
    navigate(`/game/${gameId}`);
  };

  const handleJoinGame = (gameId: string) => {
    setCurrentGame(gameId);
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900
     to-slate-900 flex flex-col"
      data-testid="welcome-screen"
    >
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
                  data-testid="create-game-button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700
                 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg
                  transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Game
                </button>
              </div>

              <ExistingGamesList
                games={games}
                isLoadingGames={isLoadingGames}
                onJoinGame={handleJoinGame}
                onCreateGame={() => setIsModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <CreateGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGameCreated={handleGameCreated}
      />
    </div>
  );
}
