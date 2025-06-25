import React, { useState, useContext } from 'react';
import { X, Coins, UtensilsCrossed } from 'lucide-react';
import { GameStateContext } from './GameStateContext';
import { useAuth } from './auth/AuthContext';

type TabType = 'income' | 'franchises';

interface GameInformationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameInformation({ isOpen, onClose }: GameInformationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const { gameState } = useContext(GameStateContext);
  const { user } = useAuth();

  // Filter franchises to show only the current user's franchises
  const userFranchises = gameState.franchises.filter(franchise => 
    user && franchise.userId === user.id
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Game Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
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
            >
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} />
                Franchise List
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
                <p className="text-4xl font-bold text-green-600">${gameState.money.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Annual Income</h4>
                  <p className="text-2xl font-bold text-blue-600">$1,000</p>
                  <p className="text-sm text-blue-600 mt-1">Per game year</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Your Franchises</h4>
                  <p className="text-2xl font-bold text-green-600">{userFranchises.length}</p>
                  <p className="text-sm text-green-600 mt-1">Owned locations</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Money Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• You receive $1,000 at the start of each game year</li>
                  <li>• Franchise placement costs vary by county difficulty</li>
                  <li>• Easy counties: $50 | Medium: $100 | Hard: $200</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'franchises' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Your Franchises</h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  {userFranchises.length} locations
                </span>
              </div>

              {userFranchises.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userFranchises.map((franchise, index) => (
                    <div key={franchise.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{franchise.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Location: {franchise.lat.toFixed(4)}, {franchise.long.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Placed: {new Date(franchise.placedAt).toLocaleDateString()} at{' '}
                            {new Date(franchise.placedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Franchises Yet</h4>
                  <p className="text-gray-500">Click on the map to start placing your first franchise!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}