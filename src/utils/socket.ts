import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "../config/jwt";
import { SocketEvents } from "../types";

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.initialize();
  }

  private initialize(): void {
    // Optional authentication middleware (allows both authenticated and anonymous users)
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (token) {
          // If token is provided, verify it
          const decoded = verifyToken(token);
          (socket as any).user = decoded;
        } else {
          // Allow anonymous users (for public viewing)
          (socket as any).user = null;
        }
        next();
      } catch (error) {
        // If token is invalid, allow connection as anonymous
        (socket as any).user = null;
        next();
      }
    });

    this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
      console.log(`✅ User connected: ${socket.id}`);
      const user = (socket as any).user;
      if (user) {
        console.log(`👤 Authenticated: ${user?.username} (${user?.userId})`);
      } else {
        console.log(`👤 Anonymous user connected`);
      }

      // Join page room
      socket.on(SocketEvents.JOIN_PAGE, (pageId: string) => {
        socket.join(`page:${pageId}`);
        const userInfo = user ? user.username : "Anonymous";
        console.log(`📄 User ${userInfo} joined page: ${pageId}`);
      });

      // Leave page room
      socket.on(SocketEvents.LEAVE_PAGE, (pageId: string) => {
        socket.leave(`page:${pageId}`);
        const userInfo = user ? user.username : "Anonymous";
        console.log(`📄 User ${userInfo} left page: ${pageId}`);
      });

      // Disconnect
      socket.on(SocketEvents.DISCONNECT, () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });
    });
  }

  // Emit new comment to page room
  public emitNewComment(pageId: string, comment: any): void {
    this.io.to(`page:${pageId}`).emit(SocketEvents.NEW_COMMENT, comment);
  }

  // Emit comment update
  public emitUpdateComment(pageId: string, comment: any): void {
    this.io.to(`page:${pageId}`).emit(SocketEvents.UPDATE_COMMENT, comment);
  }

  // Emit comment deletion
  public emitDeleteComment(pageId: string, commentId: string): void {
    this.io
      .to(`page:${pageId}`)
      .emit(SocketEvents.DELETE_COMMENT, { commentId });
  }

  // Emit like event
  public emitLikeComment(pageId: string, comment: any): void {
    this.io.to(`page:${pageId}`).emit(SocketEvents.LIKE_COMMENT, comment);
  }

  // Emit dislike event
  public emitDislikeComment(pageId: string, comment: any): void {
    this.io.to(`page:${pageId}`).emit(SocketEvents.DISLIKE_COMMENT, comment);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let socketService: SocketService | null = null;

export const initializeSocket = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error("Socket service not initialized");
  }
  return socketService;
};
