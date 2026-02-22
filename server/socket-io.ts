import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import { jwtVerify } from "jose";
import * as db from "./db";
import { ENV } from "./_core/env";

interface SocketData {
  userId: number;
  conversationIds: Set<number>;
  roomIds: Set<number>;
}

interface MessageData {
  text: string;
  senderLanguage?: string;
  recipientLanguage?: string;
  translatedText?: string;
  language?: string;
  clientMessageId?: string;
}

interface ClientToServerEvents {
  "message:send": (conversationId: number, data: MessageData) => void;
  "message:delete": (conversationId: number, messageId: number) => void;
  "typing:start": (conversationId: number) => void;
  "typing:stop": (conversationId: number) => void;
  "conversation:join": (conversationId: number) => void;
  "conversation:leave": (conversationId: number) => void;
  "room:join": (roomId: number) => void;
  "room:leave": (roomId: number) => void;
  "room:message": (roomId: number, data: MessageData) => void;
}

interface ServerToClientEvents {
  "message:new": (data: any) => void;
  "message:ack": (messageId: number) => void;
  "message:deleted": (data: { messageId: number; deletedBy: number; deletedAt: Date }) => void;
  "typing:start": (userId: number) => void;
  "typing:stop": (userId: number) => void;
  "user:online": (userId: number) => void;
  "user:offline": (userId: number) => void;
  "room:message": (data: any) => void;
  "room:message_ack": (messageId: number) => void;
  "room:user_joined": (userId: number) => void;
  "room:user_left": (userId: number) => void;
  error: (message: string) => void;
}

export function setupSocketIO(server: Server) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all origins in development, specific origins in production
        if (process.env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          // In production, validate against allowed origins
          const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      // Extract token from auth or query parameters
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        console.warn("[Socket.IO] Connection rejected: No authentication token provided");
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token using the same secret as HTTP endpoints
      // Read directly from process.env to support test environment
      const jwtSecret = process.env.JWT_SECRET || ENV.cookieSecret;
      if (!jwtSecret) {
        console.error("[Socket.IO] JWT_SECRET not configured");
        return next(new Error("Server configuration error"));
      }

      const secretKey = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token as string, secretKey, {
        algorithms: ["HS256"],
      });

      // Extract userId from JWT payload
      const userId = payload.userId as number | undefined;
      const openId = payload.openId as string | undefined;

      if (!userId && !openId) {
        console.warn("[Socket.IO] Connection rejected: Token missing userId and openId");
        return next(new Error("Invalid token: missing user identification"));
      }

      // If we have userId in the token, use it directly
      if (userId) {
        socket.data.userId = userId;
        console.log(`[Socket.IO] User ${userId} authenticated successfully`);
        return next();
      }

      // If we only have openId, look up the user in the database
      if (openId) {
        const user = await db.getUserByOpenId(openId);
        if (!user) {
          console.warn(`[Socket.IO] Connection rejected: User not found for openId ${openId}`);
          return next(new Error("User not found"));
        }
        socket.data.userId = user.id;
        console.log(`[Socket.IO] User ${user.id} authenticated successfully via openId`);
        return next();
      }

      // Should never reach here, but just in case
      return next(new Error("Authentication failed"));
    } catch (error) {
      console.error("[Socket.IO] Authentication error:", error);
      if (error instanceof Error) {
        if (error.message.includes("expired")) {
          return next(new Error("Token expired"));
        }
        return next(new Error("Invalid or expired token"));
      }
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Initialize socket data
    socket.data.conversationIds = new Set();
    socket.data.roomIds = new Set();

    // Conversation events
    socket.on("conversation:join", (conversationId) => {
      const room = `conversation:${conversationId}`;
      socket.join(room);
      socket.data.conversationIds.add(conversationId);
      
      // Notify others in conversation that user is online
      socket.to(room).emit("user:online", socket.data.userId);
      console.log(`[Socket.IO] User ${socket.data.userId} joined conversation ${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      const room = `conversation:${conversationId}`;
      socket.leave(room);
      socket.data.conversationIds.delete(conversationId);
      
      // Notify others in conversation that user left
      socket.to(room).emit("user:offline", socket.data.userId);
      console.log(`[Socket.IO] User ${socket.data.userId} left conversation ${conversationId}`);
    });

    socket.on("message:send", async (conversationId, data) => {
      try {
        // Check for duplicate message if clientMessageId is provided
        if (data.clientMessageId) {
          const existing = await db.findMessageByClientId(data.clientMessageId);
          if (existing) {
            console.log(`[Socket.IO] Duplicate message detected with clientMessageId: ${data.clientMessageId}, returning existing message ${existing.id}`);
            
            // Return existing message data
            const messageData = {
              id: existing.id,
              conversationId: existing.conversationId,
              senderId: existing.senderId,
              originalText: existing.originalText,
              translatedText: existing.translatedText,
              senderLanguage: existing.senderLanguage,
              recipientLanguage: existing.recipientLanguage,
              createdAt: existing.createdAt,
            };
            
            // Send acknowledgment with existing message
            socket.emit("message:ack", existing.id);
            return;
          }
        }
        
        // Save new message to database
        const savedMessage = await db.createMessage({
          conversationId,
          senderId: socket.data.userId,
          originalText: data.text,
          senderLanguage: data.senderLanguage || "tr",
          recipientLanguage: data.recipientLanguage || "en",
          isTranslated: false,
          clientMessageId: data.clientMessageId,
        });

        const messageData = {
          id: savedMessage.id,
          conversationId,
          senderId: socket.data.userId,
          originalText: data.text,
          translatedText: data.translatedText,
          senderLanguage: data.senderLanguage,
          recipientLanguage: data.recipientLanguage,
          createdAt: savedMessage.createdAt,
        };

        // Broadcast to all users in conversation
        io.to(`conversation:${conversationId}`).emit("message:new", messageData);

        // Send acknowledgment to sender
        socket.emit("message:ack", savedMessage.id);
        
        console.log(`[Socket.IO] Message ${savedMessage.id} sent in conversation ${conversationId}`);
      } catch (error) {
        console.error("[Socket.IO] Failed to save message:", error);
        socket.emit("error", "Failed to save message");
      }
    });

    socket.on("message:delete", (conversationId, messageId) => {
      // Broadcast deletion to all users in conversation
      io.to(`conversation:${conversationId}`).emit("message:deleted", {
        messageId,
        deletedBy: socket.data.userId,
        deletedAt: new Date(),
      });
      
      console.log(`[Socket.IO] Message ${messageId} deleted in conversation ${conversationId}`);
    });

    socket.on("typing:start", (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", socket.data.userId);
    });

    socket.on("typing:stop", (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", socket.data.userId);
    });

    // Room (group chat) events
    socket.on("room:join", (roomId) => {
      const room = `room:${roomId}`;
      socket.join(room);
      socket.data.roomIds.add(roomId);
      
      // Notify others in room that user joined
      socket.to(room).emit("room:user_joined", socket.data.userId);
      console.log(`[Socket.IO] User ${socket.data.userId} joined room ${roomId}`);
    });

    socket.on("room:leave", (roomId) => {
      const room = `room:${roomId}`;
      socket.leave(room);
      socket.data.roomIds.delete(roomId);
      
      // Notify others in room that user left
      socket.to(room).emit("room:user_left", socket.data.userId);
      console.log(`[Socket.IO] User ${socket.data.userId} left room ${roomId}`);
    });

    socket.on("room:message", async (roomId, data) => {
      try {
        // Check for duplicate message if clientMessageId is provided
        if (data.clientMessageId) {
          const existing = await db.findGroupMessageByClientId(data.clientMessageId);
          if (existing) {
            console.log(`[Socket.IO] Duplicate group message detected with clientMessageId: ${data.clientMessageId}, returning existing message ${existing.id}`);
            
            // Return existing message data
            const messageData = {
              id: existing.id,
              roomId: existing.roomId,
              senderId: existing.senderId,
              originalText: existing.originalText,
              originalLanguage: existing.originalLanguage,
              createdAt: existing.createdAt,
            };
            
            // Send acknowledgment with existing message
            socket.emit("room:message_ack", existing.id);
            return;
          }
        }
        
        // Save message to database
        const savedMessage = await db.createGroupMessage({
          roomId,
          senderId: socket.data.userId,
          originalText: data.text,
          originalLanguage: data.language || "tr",
          clientMessageId: data.clientMessageId,
        });

        const messageData = {
          id: savedMessage.id,
          roomId,
          senderId: socket.data.userId,
          originalText: data.text,
          originalLanguage: data.language,
          createdAt: savedMessage.createdAt,
        };

        // Broadcast to all users in room
        io.to(`room:${roomId}`).emit("room:message", messageData);

        // Send push notifications to offline users
        try {
          const roomParticipants = await db.getRoomParticipants(roomId);
          const sender = await db.getUserById(socket.data.userId);
          const senderProfile = await db.getUserProfile(socket.data.userId);
          
          console.log(`[Socket.IO] Checking push notifications for ${roomParticipants.length} participants`);
          
          for (const participant of roomParticipants) {
            // Skip sender
            if (participant.userId === socket.data.userId) continue;
            
            // Check if user is online (connected to Socket.IO)
            const isOnline = Array.from(io.sockets.sockets.values()).some(
              (s) => s.data.userId === participant.userId
            );
            
            console.log(`[Socket.IO] User ${participant.userId} online status: ${isOnline}`);
            
            // Send push notification if user is offline
            if (!isOnline) {
              const { sendPushNotification } = await import("./push-notification-service");
              const senderName = senderProfile?.username || sender?.name || "Someone";
              
              console.log(`[Socket.IO] Sending push notification to user ${participant.userId}`);
              
              await sendPushNotification({
                userId: participant.userId,
                title: senderName,
                body: data.text,
                data: { type: "group_message", roomId, messageId: savedMessage.id },
                sound: "default",
              });
            }
          }
        } catch (pushError) {
          console.error("[Socket.IO] Failed to send push notifications:", pushError);
        }

        // Send acknowledgment to sender
        socket.emit("room:message_ack", savedMessage.id);
        
        console.log(`[Socket.IO] Message ${savedMessage.id} sent in room ${roomId}`);
      } catch (error) {
        console.error("[Socket.IO] Failed to save room message:", error);
        socket.emit("error", "Failed to save message");
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
      
      // Notify all conversations and rooms that user went offline
      socket.data.conversationIds.forEach((conversationId) => {
        socket.to(`conversation:${conversationId}`).emit("user:offline", socket.data.userId);
      });
      
      socket.data.roomIds.forEach((roomId) => {
        socket.to(`room:${roomId}`).emit("room:user_left", socket.data.userId);
      });
    });

    socket.on("error", (error) => {
      console.error(`[Socket.IO] Socket error:`, error);
    });
  });

  console.log("[Socket.IO] Server initialized");
  return io;
}

// Helper functions for broadcasting from server-side code
export function broadcastToConversation(io: SocketIOServer, conversationId: number, event: string, data: any) {
  io.to(`conversation:${conversationId}`).emit(event as any, data);
}

export function broadcastToRoom(io: SocketIOServer, roomId: number, event: string, data: any) {
  io.to(`room:${roomId}`).emit(event as any, data);
}
