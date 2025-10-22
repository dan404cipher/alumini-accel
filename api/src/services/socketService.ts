import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import User from "../models/User";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    logger.info("🔌 Initializing minimal Socket.IO server...");

    // Ultra-minimal Socket.IO configuration
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["polling"],
    });

    logger.info("✅ Socket.IO server initialized successfully");
    this.setupAuthMiddleware();
    this.setupEventHandlers();
  }

  private setupAuthMiddleware() {
    logger.info("🔐 Setting up Socket.IO authentication middleware...");

    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          logger.warn("Socket connection attempt without token");
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
          logger.warn("Socket connection attempt with invalid user");
          return next(new Error("Authentication error: User not found"));
        }

        (socket as AuthenticatedSocket).userId = user._id.toString();
        (socket as AuthenticatedSocket).user = user;

        logger.info(
          `✅ Socket authentication successful for user: ${user.email}`
        );
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  private setupEventHandlers() {
    logger.info("🎯 Setting up Socket.IO event handlers...");

    // Simple connection handler
    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const userId = authSocket.userId!;
      const user = authSocket.user!;

      logger.info(`✅ User ${user.email} connected with socket ${socket.id}`);
      logger.info(`📊 Total connected users: ${this.connectedUsers.size + 1}`);

      // Store user connection
      this.connectedUsers.set(userId, socket.id);

      // Join user to their personal room
      socket.join(`user:${userId}`);
      logger.info(`🏠 User ${userId} joined personal room: user:${userId}`);

      // Handle joining conversation rooms
      socket.on("join_conversation", (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userId} joined conversation ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on("leave_conversation", (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${userId} left conversation ${conversationId}`);
      });

      // Handle message read status
      socket.on(
        "mark_messages_read",
        async (data: { conversationId: string; userId: string }) => {
          try {
            logger.info(
              `Marking messages as read for conversation ${data.conversationId}`
            );

            // Notify sender that messages were read
            this.emitToUser(data.userId, "messages_read", {
              conversationId: data.conversationId,
              readBy: authSocket.userId,
              timestamp: new Date(),
            });
          } catch (error) {
            logger.error("Error marking messages as read:", error);
          }
        }
      );

      // Handle typing indicators
      socket.on(
        "typing_start",
        (data: { conversationId: string; userId: string }) => {
          socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
            userId: authSocket.userId,
            isTyping: true,
            conversationId: data.conversationId,
          });
        }
      );

      socket.on(
        "typing_stop",
        (data: { conversationId: string; userId: string }) => {
          socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
            userId: authSocket.userId,
            isTyping: false,
            conversationId: data.conversationId,
          });
        }
      );

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        logger.info(`User ${user.email} disconnected: ${reason}`);
        this.connectedUsers.delete(userId);
        logger.info(`📊 Total connected users: ${this.connectedUsers.size}`);
      });

      // Handle connection errors
      socket.on("error", (error) => {
        logger.error(`Socket error for user ${user.email}:`, error);
      });
    });

    // Handle server-level errors
    this.io.on("error", (error) => {
      logger.error("Socket.IO server error:", error);
    });
  }

  // Emit to a specific user
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`user:${userId}`).emit(event, data);
      logger.info(`📤 Emitted ${event} to user ${userId}`);
    } else {
      logger.warn(`User ${userId} not connected, cannot emit ${event}`);
    }
  }

  // Emit to a conversation
  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
    logger.info(`📤 Emitted ${event} to conversation ${conversationId}`);
  }

  // Emit new message
  public emitNewMessage(message: any) {
    const conversationId = message.conversationId;
    this.emitToConversation(conversationId, "new_message", message);
  }

  // Emit new notification
  public emitNewNotification(notification: any) {
    this.emitToUser(notification.userId, "new_notification", notification);
  }

  // Emit notification update
  public emitNotificationUpdate(
    userId: string,
    notificationId: string,
    action: string
  ) {
    this.emitToUser(userId, "notification_update", {
      notificationId,
      action,
      timestamp: new Date(),
    });
  }

  // Emit notification count update
  public emitNotificationCountUpdate(userId: string, count: number) {
    this.emitToUser(userId, "notification_count_update", { count });
  }

  // Emit unread count update
  public emitUnreadCountUpdate(userId: string, count: number) {
    this.emitToUser(userId, "unread_count_update", { count });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get Socket.IO instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketService;
