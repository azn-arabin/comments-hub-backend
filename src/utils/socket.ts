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
    // Authentication middleware
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = verifyToken(token);
        (socket as any).user = decoded;
        next();
      } catch (error) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on(SocketEvents.CONNECTION, (socket: Socket) => {
      console.log(`✅ User connected: ${socket.id}`);
      const user = (socket as any).user;
      console.log(`👤 User: ${user?.username} (${user?.userId})`);

      // Join page room
      socket.on(SocketEvents.JOIN_PAGE, (pageId: string) => {
        socket.join(`page:${pageId}`);
        console.log(`📄 User ${user?.username} joined page: ${pageId}`);
      });

      // Leave page room
      socket.on(SocketEvents.LEAVE_PAGE, (pageId: string) => {
        socket.leave(`page:${pageId}`);
        console.log(`📄 User ${user?.username} left page: ${pageId}`);
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
