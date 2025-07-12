import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchStatsByTurnForUser } from '../api_calls/HTTPRequests';
import { getCurrentGameId } from '../utils/gameUrl';
import { useAuth } from '../auth/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TurnStatsProps {
  isVisible: boolean;
}

interface TurnStat {
  id: number;
  turnNumber: number;
  incomeReceived: number;
  totalMoney: number;
  totalFranchises: number;
  createdAt: Date;
}

export default function TurnStats({ isVisible }: TurnStatsProps) {
  const [turnStatsData, setTurnStatsData] = useState<TurnStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isVisible) {
      loadTurnStats();
    }
  }, [isVisible, user]);

  const loadTurnStats = async () => {
    const gameId = getCurrentGameId();
    if (!user || !gameId) return;

    setStatsLoading(true);
    try {
      const result = await fetchStatsByTurnForUser(gameId, user.id);
      if (result.success) {
        setTurnStatsData(result.stats || []);
      } else {
        console.error('Error fetching turn stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching turn stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Prepare Chart.js data
  const chartData = {
    labels: turnStatsData.map(stat => `Turn ${stat.turnNumber}`),
    datasets: [
      {
        label: 'Income per Turn',
        data: turnStatsData.map(stat => stat.incomeReceived),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.2, // Smooth curves
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we only have one dataset
      },
      title: {
        display: true,
        text: 'Income Over Time',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: '#374151',
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const dataIndex = context.dataIndex;
            const stat = turnStatsData[dataIndex];
            return [
              `Total Money: $${stat.totalMoney.toLocaleString()}`,
              `Franchises: ${stat.totalFranchises}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
        title: {
          display: true,
          text: 'Income ($)',
          font: {
            size: 14,
          },
          color: '#6b7280',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Turn',
          font: {
            size: 14,
          },
          color: '#6b7280',
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      ) : turnStatsData.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-6">
          {/* Chart Container */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div style={{ height: '400px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          
          {/* Summary stats below chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-800">Average Income</h5>
              <p className="text-2xl font-bold text-blue-600">
                ${Math.round(turnStatsData.reduce((sum, stat) => sum + stat.incomeReceived, 0) / turnStatsData.length).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-800">Peak Income</h5>
              <p className="text-2xl font-bold text-green-600">
                ${Math.max(...turnStatsData.map(s => s.incomeReceived)).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-800">Current Franchises</h5>
              <p className="text-2xl font-bold text-purple-600">
                {turnStatsData.length > 0 ? turnStatsData[turnStatsData.length - 1].totalFranchises : 0}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">No statistics yet</p>
          <p className="text-gray-500">Statistics will appear once turns have been played</p>
        </div>
      )}
    </div>
  );
}