import { io, Socket } from "socket.io-client";

interface SocketEvents {
  new_message: (message: unknown) => void;
  messages_read: (data: {
    conversationId: string;
    readBy: string;
    timestamp: Date;
  }) => void;
  user_typing: (data: {
    userId: string;
    isTyping: boolean;
    conversationId: string;
  }) => void;
  new_notification: (notification: unknown) => void;
  notification_update: (data: {
    notificationId: string;
    action: string;
    timestamp: Date;
  }) => void;
  notification_count_update: (data: { count: number }) => void;
  unread_count_update: (data: { count: number }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    // Check localStorage first (remember me), then sessionStorage
    let token = localStorage.getItem("token");
    if (!token) {
      token = sessionStorage.getItem("token");
    }

    if (!token) {
      console.warn("No authentication token found, skipping socket connection");
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // Ultra-minimal configuration for maximum compatibility
    this.socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      transports: ["polling"], // Start with polling only
      forceNew: true,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  // Connection management
  public connectSocket() {
    if (!this.socket || !this.isConnected) {
      this.connect();
    }
  }

  public disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Event listeners
  public on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.socket) {
      this.socket.on(event as string, callback as (...args: unknown[]) => void);
    }
  }

  public off<K extends keyof SocketEvents>(
    event: K,
    callback?: SocketEvents[K]
  ) {
    if (this.socket) {
      this.socket.off(
        event as string,
        callback as (...args: unknown[]) => void
      );
    }
  }

  // Message events
  public joinConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("join_conversation", conversationId);
    }
  }

  public leaveConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("leave_conversation", conversationId);
    }
  }

  public markMessagesAsRead(conversationId: string, userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("mark_messages_read", { conversationId, userId });
    }
  }

  public startTyping(conversationId: string, userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", { conversationId, userId });
    }
  }

  public stopTyping(conversationId: string, userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", { conversationId, userId });
    }
  }

  // Utility methods
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public getConnectionState(): string {
    if (!this.socket) return "disconnected";
    return this.socket.connected ? "connected" : "disconnected";
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
