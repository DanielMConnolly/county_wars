import { io, Socket } from 'socket.io-client';
import { Game } from '../types/GameTypes';

export class WelcomeSocketService {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected, just resolve
      if (this.socket && this.socket.connected) {
        console.log('Already connected to welcome server');
        resolve();
        return;
      }

      // Disconnect any existing connection first
      this.disconnect();

      this.socket = io('http://localhost:3001', {
        autoConnect: true,
        reconnection: false, // Disable automatic reconnection to prevent loops
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('Connected to welcome server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Welcome connection error:', error);
        reject(error);
      });

      // Set up welcome-specific event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('game-created', (data) => {
      this.emit('game-created', data);
    });

    this.socket.on('game-deleted', (data) => {
      this.emit('game-deleted', data);
    });

    this.socket.on('game-status-changed', (data) => {
      this.emit('game-status-changed', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
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
      console.log('Disconnecting from welcome server');
      this.socket.removeAllListeners();
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
export const welcomeSocketService = new WelcomeSocketService();