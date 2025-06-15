export const getCost = (difficulty) => {
    const costs = { Easy: 100, Medium: 250, Hard: 500 };
    return costs[difficulty] || 100;
  };

  export const formatNumber = (num) => {
    return num.toLocaleString();
  };

  export const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
