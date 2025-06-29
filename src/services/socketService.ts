import { io, Socket } from 'socket.io-client';
import { Franchise } from '../types/GameTypes';

export class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private gameId: string | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(userId: string, gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;
      this.gameId = gameId;

      this.socket = io('http://localhost:3001', {
        auth: {
          userId: userId,
          gameId: gameId
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;
    this.socket.on('franchise-added', (data) => {
      this.emit('franchise-added', data);
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

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  placeFranchise(franchiseData: Franchise) {
    if (this.socket) {
      this.socket.emit('franchise-placed', franchiseData);
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
      this.socket.disconnect();
      this.socket = null;
    }
    this.callbacks.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export a singleton instance
export const socketService = new SocketService();
