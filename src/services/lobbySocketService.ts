import { io, Socket } from 'socket.io-client';
import { GameUpdate } from '../types/GameTypes';
import { getServerURL } from '../utils/serverUtils';

export class LobbySocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private gameId: string | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(userId: string, gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected to the same game, just resolve
      if (this.socket && this.socket.connected && this.gameId === gameId && this.userId === userId) {
        console.log('Already connected to lobby server');
        resolve();
        return;
      }

      // Disconnect any existing connection first
      this.disconnect();

      this.userId = userId;
      this.gameId = gameId;

      console.log('Connecting to lobby server');

      this.socket = io(getServerURL('/lobby'), {
        auth: {
          userId: userId,
          gameId: gameId
        },
        autoConnect: true,
        reconnection: false, // Disable automatic reconnection to prevent loops
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('Connected to lobby server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Lobby connection error:', error);
        reject(error);
      });

      // Set up lobby-specific event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('lobby-updated', (data) => {
      this.emit('lobby-updated', data);
    });

    this.socket.on('game-starting', (data) => {
      this.emit('game-starting', data);
    });

    this.socket.on('lobby-chat-message', (data) => {
      this.emit('lobby-chat-message', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  // Lobby-specific methods
  startGame(settings?: GameUpdate) {
    if (this.socket) {
      this.socket.emit('start-game', settings || {});
    }
  }

  setPlayerReady(isReady: boolean) {
    if (this.socket) {
      this.socket.emit('player-ready', { isReady });
    }
  }

  sendChatMessage(message: string) {
    if (this.socket) {
      this.socket.emit('lobby-chat', { message });
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
      console.log('Disconnecting from lobby server');
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
export const lobbySocketService = new LobbySocketService();
