import React, { useState, useEffect} from 'react';
import { Plus, Crown, Play, Search } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { fetchDraftGames, fetchUserLiveGames, createGame } from './api_calls/HTTPRequests';
import { useNavigate } from 'react-router-dom';
import UserMenu from './auth/UserMenu';
import ExistingGamesList from './ExistingGamesList';
import GamesToJoin from './GamesToJoin';
import { DataTestIDs } from './DataTestIDs';
import { useToast } from './Toast/ToastContext';
import { connectToWelcomeSocket, disconnectFromWelcomeSocket } from './services/connectToWelcomeSocket';
import {Game} from './types/GameTypes';

type TabType = 'myGames' | 'joinGames';

export default function WelcomeScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('myGames');
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [isLoadingMyGames, setIsLoadingMyGames] = useState(false);
  const [isLoadingAvailableGames, setIsLoadingAvailableGames] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      loadMyGames();
    }
    loadAvailableGames();
  }, [user?.id]);

  // Socket connection for real-time updates
  useEffect(() => {
    const handleGameCreated = (game: Game) => {
      if (game.status === 'DRAFT') {
        setAvailableGames(prevGames => [game, ...prevGames]);
      }
    };

    const handleGameDeleted = (gameId: string) => {
      setAvailableGames(prevGames => prevGames.filter(g => g.id !== gameId));
      // Also remove from myGames if it was there
      setMyGames(prevGames => prevGames.filter(g => g.id !== gameId));
    };

    const handleGameStatusChanged = (data: { gameId: string; status: string }) => {
      if (data.status === 'LIVE') {
        // Remove from available games when it becomes live
        setAvailableGames(prevGames => prevGames.filter(g => g.id !== data.gameId));
        // Refresh myGames to potentially include the new live game
        if (user?.id) {
          loadMyGames();
        }
      }
    };

    connectToWelcomeSocket({
      onGameCreated: handleGameCreated,
      onGameDeleted: handleGameDeleted,
      onGameStatusChanged: handleGameStatusChanged,
      showToast
    });

    return () => {
      disconnectFromWelcomeSocket();
    };
  }, [user?.id]); // Removed showToast from dependencies to prevent re-connections

  const loadMyGames = async () => {
    if (!user?.id) return;
    
    setIsLoadingMyGames(true);
    try {
      const result = await fetchUserLiveGames(user.id);
      if (result.success && result.games) {
        setMyGames(result.games);
      } else {
        console.error('Failed to fetch user games:', result.error);
        setMyGames([]);
      }
    } catch (error) {
      console.error('Error fetching user games:', error);
      setMyGames([]);
    } finally {
      setIsLoadingMyGames(false);
    }
  };

  const loadAvailableGames = async () => {
    setIsLoadingAvailableGames(true);
    try {
      const result = await fetchDraftGames();
      if (result.success && result.games) {
        setAvailableGames(result.games);
      } else {
        console.error('Failed to fetch games:', result.error);
        setAvailableGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setAvailableGames([]);
    } finally {
      setIsLoadingAvailableGames(false);
    }
  };

  const handleJoinGame = (gameId: string) => {
    const targetGame = activeTab === 'myGames' 
      ? myGames.find(g => g.id === gameId)
      : availableGames.find(g => g.id === gameId);
    
    if (targetGame?.status === 'LIVE') {
      // Navigate directly to the game for live games
      navigate(`/game/${gameId}`);
    } else {
      // Navigate to lobby for draft games
      navigate(`/lobby/${gameId}`);
    }
  };

  const handleCreateGame = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await createGame(user.id);
      if (result.success && result.gameId) {
        navigate(`/lobby/${result.gameId}`);
      } else {
        alert(result.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    }
  };

  const tabs = [
    {
      id: 'myGames' as TabType,
      label: 'My Games',
      icon: Play,
      count: myGames.length,
    },
    {
      id: 'joinGames' as TabType,
      label: 'Join Game',
      icon: Search,
      count: availableGames.length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900
     to-slate-900 flex flex-col"
      data-testid={DataTestIDs.WELCOME_SCREEN}
    >
      {/* Top Menu Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800
        to-slate-700 flex items-center justify-between px-6 z-[1000] shadow-lg
        border-b border-slate-600">
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          Franchise Wars
        </button>
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
              Continue your games or join new franchise empires
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20
         overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-6 py-4 flex items-center justify-center gap-3 font-medium
                        transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-white/10 text-white border-b-2 border-blue-400'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          activeTab === tab.id 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-600 text-gray-200'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {activeTab === 'myGames' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Your Active Games</h3>
                  </div>
                  <ExistingGamesList
                    games={myGames}
                    isLoadingGames={isLoadingMyGames}
                    onJoinGame={handleJoinGame}
                  />
                </>
              )}

              {activeTab === 'joinGames' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Available Games</h3>
                    <button
                      data-testid={DataTestIDs.CREATE_GAME_BUTTON}
                      onClick={handleCreateGame}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700
                     hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg
                      transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Game
                    </button>
                  </div>
                  <GamesToJoin
                    games={availableGames}
                    isLoadingGames={isLoadingAvailableGames}
                    onJoinGame={handleJoinGame}
                    onGameDeleted={loadAvailableGames}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}