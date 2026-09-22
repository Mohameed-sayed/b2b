import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types/game';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  private backendUrl: string;
  private isConnecting: boolean = false;
  private networkIp: string = '';

  constructor() {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const browserPort = typeof window !== 'undefined' ? window.location.port : '';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    // Check for explicit vite env override
    const envUrl = (import.meta as unknown as { env: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL;
    
    if (envUrl) {
      this.backendUrl = envUrl;
    } else if (browserPort === '5173' || browserPort === '3000') {
      // Local development - backend is on 3001
      this.backendUrl = `${protocol}//${hostname}:3001`;
    } else {
      // Production (DigitalOcean Nginx proxy) - connect to same host/port
      this.backendUrl = `${protocol}//${hostname}${browserPort ? ':' + browserPort : ''}`;
    }
  }

  public getSocket(): TypedSocket {
    if (!this.socket) {
      this.socket = io(this.backendUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected with ID:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('[Socket] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[Socket] Connection error:', error.message);
      });
    }

    return this.socket;
  }

  public connect(): TypedSocket {
    const s = this.getSocket();
    if (!s.connected && !this.isConnecting) {
      this.isConnecting = true;
      s.connect();
      s.once('connect', () => {
        this.isConnecting = false;
      });
      s.once('connect_error', () => {
        this.isConnecting = false;
      });
    }
    return s;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Fetches local network IP from the server /api/network-ip
   * Fallback to current browser hostname if unavailable
   */
  public async fetchNetworkIp(): Promise<string> {
    if (this.networkIp) return this.networkIp;

    try {
      const res = await fetch(`${this.backendUrl}/api/network-ip`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          this.networkIp = data.ip;
          return data.ip;
        }
      }
    } catch {
      // Backend not yet reachable or API endpoint missing
    }

    const fallback = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    this.networkIp = fallback;
    return fallback;
  }

  // Local storage helpers for participant session resilience
  public saveParticipantSession(
    roomCode: string,
    participantId: string,
    name: string,
    avatar: string = '',
    team: string = ''
  ): void {
    try {
      localStorage.setItem(
        'ischool_session',
        JSON.stringify({ roomCode, participantId, name, avatar, team, timestamp: Date.now() })
      );
    } catch {
      // Storage access error
    }
  }

  public getParticipantSession(): {
    roomCode: string;
    participantId: string;
    name: string;
    avatar: string;
    team: string;
  } | null {
    try {
      const data = localStorage.getItem('ischool_session');
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Valid for 6 hours
      if (Date.now() - parsed.timestamp > 6 * 60 * 60 * 1000) {
        localStorage.removeItem('ischool_session');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public clearParticipantSession(): void {
    try {
      localStorage.removeItem('ischool_session');
    } catch {
      // Storage access error
    }
  }
}

export const socketService = new SocketService();
