import React, { useState, useContext, useEffect } from 'react';
import { X, Coins, UtensilsCrossed, Trophy, Package } from 'lucide-react';
import { GameStateContext } from '../GameStateContext';
import { useAuth } from '../auth/AuthContext';
import { DataTestIDs } from '../DataTestIDs';
import GameStandings from './GameStandings';
import FranchiseList from './FranchiseList';
import DistributionCenterList from './DistributionCenterList';
import { fetchFranchiseIncome } from '../api_calls/HTTPRequests';
import { getCurrentGameId } from '../utils/gameUrl';
import { Franchise } from '../types/GameTypes';

type TabType = 'income' | 'franchises' | 'distribution-centers' | 'standings';

interface GameInformationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameInformationPanel({ isOpen, onClose }: GameInformationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [totalIncome, setTotalIncome] = useState(0);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [franchiseIncomeData, setFranchiseIncomeData] = useState<
    Array<{ id: string; name: string; income: number }>
  >([]);
  const { gameState } = useContext(GameStateContext);
  const { user } = useAuth();

 // @ts-expect-error Assigning placed location to franchise is ok
  const userFranchises: Franchise[]= gameState.locations.filter(
    location => user && location.userId === user.id && (!location.locationType || location.locationType === 'franchise'
    )
  );

  // Filter distribution centers to show only the current user's distribution centers
  const userDistributionCenters = gameState.locations.filter(
    location => user && location.userId === user.id && location.locationType === 'distribution-center'
  );

  // Fetch franchise income data when the component opens
  useEffect(() => {
    loadFranchiseIncome();
  }, [isOpen, user]);

  const loadFranchiseIncome = async () => {
    const gameId = getCurrentGameId();
    if (!user || !gameId) return;

    setIncomeLoading(true);
    try {
      const result = await fetchFranchiseIncome(gameId, user.id);
      if (result.success) {
        setTotalIncome(result.totalIncome || 0);
        setFranchiseIncomeData(result.franchises || []);
      } else {
        console.error('Error fetching franchise income:', result.error);
      }
    } catch (error) {
      console.error('Error fetching franchise income:', error);
    } finally {
      setIncomeLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center
     justify-center z-50"
      data-testid={DataTestIDs.GAME_INFO_MODAL}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Game Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            data-testid={DataTestIDs.GAME_INFO_CLOSE_BUTTON}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('income')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'income'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins size={16} />
                Income
              </div>
            </button>
            <button
              onClick={() => setActiveTab('franchises')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'franchises'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid={DataTestIDs.GAME_INFO_FRANCHISES_TAB}
            >
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} />
                Franchise List
              </div>
            </button>
            <button
              onClick={() => setActiveTab('distribution-centers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'distribution-centers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={16} />
                Distribution Centers
              </div>
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'standings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy size={16} />
                Game Standings
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <Coins className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Current Balance</h3>
                <p className="text-4xl font-bold text-green-600">
                  ${gameState.money.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Total Income</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {incomeLoading ? 'Loading...' : `$${totalIncome.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">From all franchises</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Your Franchises</h4>
                  <p
                    className="text-2xl font-bold text-green-600"
                    data-testid={DataTestIDs.GAME_INFO_FRANCHISES_COUNT}
                  >
                    {userFranchises.length}
                  </p>
                  <p className="text-sm text-green-600 mt-1">Owned locations</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Income Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Each franchise generates income based on its population</li>
                  <li>• Higher population areas generate more income (up to $1,000)</li>
                  <li>• Income is calculated proportionally from population data</li>
                  <li>• Franchise placement costs vary by county difficulty</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'franchises' && (
            <FranchiseList
              userFranchises={userFranchises}
              gameState={gameState}
              franchiseIncomeData={franchiseIncomeData}
            />
          )}

          {activeTab === 'distribution-centers' && (
            <DistributionCenterList
              userDistributionCenters={userDistributionCenters}
              gameState={gameState}
            />
          )}

          {activeTab === 'standings' && <GameStandings isVisible={activeTab === 'standings'} />}
        </div>
      </div>
    </div>
  );
}
