import { io, Socket } from 'socket.io-client';
import { Franchise } from '../types/GameTypes';

export class GameSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private gameId: string | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(userId: string, gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected to the same game, just resolve
      if (this.socket && this.socket.connected && this.gameId === gameId && this.userId === userId) {
        console.log('Already connected to game server');
        resolve();
        return;
      }

      // Disconnect any existing connection first
      this.disconnect();

      this.userId = userId;
      this.gameId = gameId;

      this.socket = io('http://localhost:3001/game', {
        auth: {
          userId: userId,
          gameId: gameId
        },
        autoConnect: true,
        reconnection: false, // Disable automatic reconnection to prevent loops
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('Connected to game server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Game connection error:', error);
        reject(error);
      });

      // Set up game-specific event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('franchise-added', (data) => {
      this.emit('franchise-added', data);
    });

    this.socket.on('franchise-removed', (data) => {
      this.emit('franchise-removed', data);
    });

    this.socket.on('time-update', (data) => {
      this.emit('time-update', data);
    });

    this.socket.on('game-paused', (data) => {
      this.emit('game-paused', data);
    });

    this.socket.on('game-resumed', (data) => {
      this.emit('game-resumed', data);
    });

    this.socket.on('money-update', (data) => {
      this.emit('money-update', data);
    });

    this.socket.on('player-county-selected', (data) => {
      this.emit('player-county-selected', data);
    });

    this.socket.on('game-chat-message', (data) => {
      this.emit('game-chat-message', data);
    });

    this.socket.on('game-state-sync', (data) => {
      this.emit('game-state-sync', data);
    });

    this.socket.on('player-left', (data) => {
      this.emit('player-left', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  // Game-specific methods
  placeFranchise(franchiseData: Franchise) {
    if (this.socket) {
      this.socket.emit('franchise-placed', franchiseData);
    }
  }

  removeFranchise(franchiseData: any) {
    if (this.socket) {
      this.socket.emit('franchise-removed', franchiseData);
    }
  }

  pauseGame() {
    if (this.socket) {
      this.socket.emit('game-paused', {});
    }
  }

  resumeGame() {
    if (this.socket) {
      this.socket.emit('game-resumed', {});
    }
  }

  selectCounty(county: any) {
    if (this.socket) {
      this.socket.emit('county-selected', { county });
    }
  }

  sendChatMessage(message: string) {
    if (this.socket) {
      this.socket.emit('game-chat', { message });
    }
  }

  requestGameSync() {
    if (this.socket) {
      this.socket.emit('request-game-sync', {});
    }
  }

  // Event system for React components
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit<T>(event: string, data: T) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from game server');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.callbacks.clear();
    this.userId = null;
    this.gameId = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export a singleton instance
export const gameSocketService = new GameSocketService();