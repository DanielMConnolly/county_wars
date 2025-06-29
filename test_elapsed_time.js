// Quick test to verify elapsed time conversion
const { elapsedTimeToGameDate } = require('./dist/src/utils/elapsedTimeToGameDate.js');

// Test cases
console.log('Testing elapsed time to game date conversion:');
console.log('0ms (game start):', elapsedTimeToGameDate(0, 1));
console.log('1800000ms (30 minutes):', elapsedTimeToGameDate(1800000, 1)); // 30 minutes into 1-hour game
console.log('3600000ms (1 hour):', elapsedTimeToGameDate(3600000, 1)); // End of 1-hour game
console.log('900000ms (15 minutes):', elapsedTimeToGameDate(900000, 1)); // 15 minutes into 1-hour game