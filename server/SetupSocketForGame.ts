import { Server } from 'socket.io';
import { dbOperations } from './database.js';
import type { ServerGameState } from '../src/types/GameTypes.js';
import { calculateTotalIncomeForPlayer } from './incomeUtils.js';

// Extend Socket.IO socket to include custom userId property
declare module 'socket.io' {
  interface Socket {
    userId: string;
    gameId: string;
  }
}

// Store game state for each game (gameId -> ServerGameState) - exported for server access
export const gameStates = new Map<string, ServerGameState>();

export function setupSocketForGame(io: Server, namespace = '/game') {
  const gameNamespace = io.of(namespace);

  // Store active user sessions
  const userSessions = new Map(); // socketId -> userId

  // Authentication middleware for socket connections
  gameNamespace.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const gameId = socket.handshake.auth.gameId || 'default-game';
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    socket.gameId = gameId;
    next();
  });

  gameNamespace.on('connection', async (socket) => {

    // Register user session and ensure user exists in database
    userSessions.set(socket.id, { userId: socket.userId, gameId: socket.gameId });
    dbOperations.createUser(socket.userId);

    // Join the game-specific room
    socket.join(`game-${socket.gameId}`);

    // Initialize game state if it doesn't exist, reading turn info from database
    if (!gameStates.has(socket.gameId)) {
      try {
        const turnInfo = await dbOperations.getGameTurnInfo(socket.gameId);

        gameStates.set(socket.gameId, {
          turnNumber: turnInfo.turnNumber,
          playerWhosTurnItIs: turnInfo.playerWhosTurnItIs,
          lobbyPlayers: []
        });
      } catch (error) {
        console.error(`Error reading turn info from DB for game ${socket.gameId}:`, error);
        // Fallback to default state
        gameStates.set(socket.gameId, {
          turnNumber: 1,
          playerWhosTurnItIs: null,
          lobbyPlayers: []
        });
      }
    }

    // Handle franchise removal events
    socket.on('franchise-removed', (franchiseData) => {
      // Broadcast to all other users in the same game
      socket.to(`game-${socket.gameId}`).emit('franchise-removed', franchiseData);
    });

    // Handle turn advancement
    socket.on('advance-turn', async () => {
      const gameState = gameStates.get(socket.gameId);
      if (!gameState) return;

      // Only allow current player to advance their turn
      if (gameState.playerWhosTurnItIs !== socket.userId) {
        socket.emit('turn-error', { message: 'Not your turn' });
        return;
      }

      try {
        // Get all players in the game to determine next player
        const players = await dbOperations.getGamePlayersWithMoney(socket.gameId);
        if (players.length === 0) {
          socket.emit('turn-error', { message: 'No players in game' });
          return;
        }

        // Find current player index and calculate next player
        const currentPlayerIndex = players.findIndex(p => p.userId === gameState.playerWhosTurnItIs);
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayerId = players[nextPlayerIndex].userId;

        // Update database
        const success = await dbOperations.advanceGameTurn(socket.gameId, nextPlayerId);
        if (success) {
          // Update local state
          gameState.turnNumber += 1;
          gameState.playerWhosTurnItIs = nextPlayerId;
          gameStates.set(socket.gameId, gameState);
          try {
            const incomeAmount = await calculateTotalIncomeForPlayer(nextPlayerId, socket.gameId);
            if (incomeAmount > 0) {
              const currentMoney = await dbOperations.getUserGameMoney(nextPlayerId, socket.gameId);
              const newMoney = currentMoney + incomeAmount;
              await dbOperations.updateUserGameMoney(nextPlayerId, socket.gameId, newMoney);

              // Record income in IncomeAtTurn table
              await dbOperations.createIncomeAtTurn(nextPlayerId, socket.gameId, gameState.turnNumber, incomeAmount);

              // Emit money update to the next player
              gameNamespace.to(`game-${socket.gameId}`).emit('money-update', {
                userId: nextPlayerId,
                newMoney: newMoney,
                incomeReceived: incomeAmount
              });
            }
          } catch (error) {
            console.error(`Error calculating income for player ${nextPlayerId}:`, error);
          }

          // Record stats for all players at the start of this turn
          try {
            for (const player of players) {
              const playerMoney = await dbOperations.getUserGameMoney(player.userId, socket.gameId);
              const playerFranchises = await dbOperations.getUserGameFranchises(player.userId, socket.gameId);
              const playerIncome = await calculateTotalIncomeForPlayer(player.userId, socket.gameId);

              await dbOperations.createStatsByTurn(
                player.userId,
                socket.gameId,
                gameState.turnNumber,
                playerIncome,
                playerMoney,
                playerFranchises.length
              );
            }
          } catch (error) {
            console.error(`Error recording stats by turn for game ${socket.gameId}:`, error);
          }

          // Broadcast turn update to all players
          gameNamespace.to(`game-${socket.gameId}`).emit('turn-update', {
            turnNumber: gameState.turnNumber,
            playerWhosTurnItIs: gameState.playerWhosTurnItIs
          });
        } else {
          socket.emit('turn-error', { message: 'Failed to advance turn' });
        }
      } catch (error) {
        console.error(`Error advancing turn for game ${socket.gameId}:`, error);
        socket.emit('turn-error', { message: 'Database error' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      userSessions.delete(socket.id);

      // Notify other players that this user left the game
      socket.to(`game-${socket.gameId}`).emit('player-left', {
        userId: socket.userId
      });
    });
  });

  return gameNamespace;
}
