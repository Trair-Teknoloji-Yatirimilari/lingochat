import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/constants/oauth";
import { getSessionToken } from "@/lib/_core/auth";

// Connection states
type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

// Message data structure
interface MessageData {
  text: string;
  senderLanguage?: string;
  recipientLanguage?: string;
  translatedText?: string;
  language?: string;
  clientMessageId?: string;
}

// Event callback types
type MessageCallback = (message: any) => void;
type TypingCallback = (userId: number, isTyping: boolean) => void;
type PresenceCallback = (userId: number, isOnline: boolean) => void;
type MessageDeletedCallback = (messageId: number) => void;

// Hook return type
interface UseSocketIOReturn {
  connected: boolean;
  connecting: boolean;
  connectionState: ConnectionState;
  error: Error | null;
  sendMessage: (conversationId: number, data: MessageData) => Promise<number>;
  sendRoomMessage: (roomId: number, data: MessageData) => Promise<number>;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  joinRoom: (roomId: number) => void;
  leaveRoom: (roomId: number) => void;
  onMessage: (callback: MessageCallback) => () => void;
  onRoomMessage: (callback: MessageCallback) => () => void;
  onTyping: (callback: TypingCallback) => () => void;
  onPresence: (callback: PresenceCallback) => () => void;
  onMessageDeleted: (callback: MessageDeletedCallback) => () => void;
  sendMessageDeleted: (messageId: number) => void;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
}

// Generate UUID for client message IDs
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Socket.IO client hook for real-time messaging
 * 
 * Features:
 * - JWT authentication
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Message acknowledgment with retry
 * - Event listeners for messages, typing, and presence
 * 
 * Requirements: 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.2.5
 */
export function useSocketIO(): UseSocketIOReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectionAttemptRef = useRef(0);
  const messageCallbacksRef = useRef<Set<MessageCallback>>(new Set());
  const roomMessageCallbacksRef = useRef<Set<MessageCallback>>(new Set());
  const typingCallbacksRef = useRef<Set<TypingCallback>>(new Set());
  const presenceCallbacksRef = useRef<Set<PresenceCallback>>(new Set());
  const messageDeletedCallbacksRef = useRef<Set<MessageDeletedCallback>>(new Set());
  const activeConversationsRef = useRef<Set<number>>(new Set());
  const activeRoomsRef = useRef<Set<number>>(new Set());

  // Initialize socket connection
  useEffect(() => {
    let mounted = true;

    async function initializeSocket() {
      try {
        // Get JWT token
        const token = await getSessionToken();
        if (!token) {
          console.log("[Socket.IO] No session token available, skipping connection");
          return;
        }

        // Get server URL - Socket.IO handles protocol conversion internally
        const socketUrl = getApiBaseUrl();

        console.log("[Socket.IO] Connecting to:", socketUrl);
        console.log("[Socket.IO] Platform:", Platform.OS);
        console.log("[Socket.IO] Token present:", !!token);
        setConnectionState("connecting");

        // Create socket instance with exponential backoff configuration
        // For iOS, start with polling transport to avoid WebSocket issues
        const socket = io(socketUrl, {
          auth: {
            token,
          },
          transports: Platform.OS === "ios" ? ["polling", "websocket"] : ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: Infinity,
          timeout: 10000,
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on("connect", () => {
          if (!mounted) return;
          console.log("[Socket.IO] Connected successfully");
          setConnectionState("connected");
          setError(null);
          reconnectionAttemptRef.current = 0;

          // Rejoin all active conversations and rooms
          activeConversationsRef.current.forEach((conversationId) => {
            socket.emit("conversation:join", conversationId);
          });
          activeRoomsRef.current.forEach((roomId) => {
            socket.emit("room:join", roomId);
          });
        });

        socket.on("connect_error", (err) => {
          if (!mounted) return;
          console.error("[Socket.IO] Connection error:", err.message);
          setConnectionState("error");
          setError(new Error(err.message || "Connection failed"));
        });

        socket.on("disconnect", (reason) => {
          if (!mounted) return;
          console.log("[Socket.IO] Disconnected:", reason);
          setConnectionState("disconnected");

          // If server disconnected us, try to reconnect
          if (reason === "io server disconnect") {
            socket.connect();
          }
        });

        // Implement exponential backoff for reconnection
        socket.io.on("reconnect_attempt", (attempt) => {
          if (!mounted) return;
          console.log("[Socket.IO] Reconnection attempt:", attempt);
          setConnectionState("connecting");
          reconnectionAttemptRef.current = attempt;

          // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, max 30s
          const delays = [1000, 2000, 4000, 8000, 16000, 30000];
          const delay = delays[Math.min(attempt - 1, delays.length - 1)];
          socket.io.opts.reconnectionDelay = delay;
        });

        socket.io.on("reconnect", (attempt) => {
          if (!mounted) return;
          console.log("[Socket.IO] Reconnected after", attempt, "attempts");
          setConnectionState("connected");
          setError(null);
        });

        socket.io.on("reconnect_failed", () => {
          if (!mounted) return;
          console.error("[Socket.IO] Reconnection failed");
          setConnectionState("error");
          setError(new Error("Failed to reconnect"));
        });

        // Message event handlers
        socket.on("message:new", (message) => {
          messageCallbacksRef.current.forEach((callback) => callback(message));
        });

        socket.on("room:message", (message) => {
          roomMessageCallbacksRef.current.forEach((callback) => callback(message));
        });

        // Typing event handlers
        socket.on("typing:start", (userId: number) => {
          typingCallbacksRef.current.forEach((callback) => callback(userId, true));
        });

        socket.on("typing:stop", (userId: number) => {
          typingCallbacksRef.current.forEach((callback) => callback(userId, false));
        });

        // Presence event handlers
        socket.on("user:online", (userId: number) => {
          presenceCallbacksRef.current.forEach((callback) => callback(userId, true));
        });

        socket.on("user:offline", (userId: number) => {
          presenceCallbacksRef.current.forEach((callback) => callback(userId, false));
        });

        // Message deleted event handler
        socket.on("message:deleted", (messageId: number) => {
          messageDeletedCallbacksRef.current.forEach((callback) => callback(messageId));
        });

        // Error handler
        socket.on("error", (errorMessage: string) => {
          console.error("[Socket.IO] Server error:", errorMessage);
          setError(new Error(errorMessage));
        });

      } catch (err) {
        if (!mounted) return;
        console.error("[Socket.IO] Initialization error:", err);
        setConnectionState("error");
        setError(err instanceof Error ? err : new Error("Failed to initialize socket"));
      }
    }

    initializeSocket();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (socketRef.current) {
        console.log("[Socket.IO] Disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Send message with retry and acknowledgment
  const sendMessage = useCallback(
    async (conversationId: number, data: MessageData): Promise<number> => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected");
      }

      const clientMessageId = generateUUID();
      const maxRetries = 3;
      const timeouts = [500, 1000, 2000]; // Exponential backoff

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Send message with timeout
          const messageId = await new Promise<number>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Message acknowledgment timeout"));
            }, 2000);

            // Listen for acknowledgment
            const ackHandler = (ackMessageId: number) => {
              clearTimeout(timeout);
              resolve(ackMessageId);
            };

            socket.once("message:ack", ackHandler);

            // Send message
            socket.emit("message:send", conversationId, {
              ...data,
              clientMessageId,
            });
          });

          return messageId;
        } catch (err) {
          console.error(`[Socket.IO] Message send attempt ${attempt + 1} failed:`, err);

          // If not the last attempt, wait before retrying
          if (attempt < maxRetries - 1) {
            await sleep(timeouts[attempt]);
          } else {
            // All retries exhausted
            throw new Error("Failed to send message after retries");
          }
        }
      }

      throw new Error("Failed to send message");
    },
    []
  );

  // Send room message with retry and acknowledgment
  const sendRoomMessage = useCallback(
    async (roomId: number, data: MessageData): Promise<number> => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected");
      }

      const clientMessageId = generateUUID();
      const maxRetries = 3;
      const timeouts = [500, 1000, 2000]; // Exponential backoff

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Send message with timeout
          const messageId = await new Promise<number>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Message acknowledgment timeout"));
            }, 2000);

            // Listen for acknowledgment
            const ackHandler = (ackMessageId: number) => {
              clearTimeout(timeout);
              resolve(ackMessageId);
            };

            socket.once("room:message_ack", ackHandler);

            // Send message
            socket.emit("room:message", roomId, {
              ...data,
              clientMessageId,
            });
          });

          return messageId;
        } catch (err) {
          console.error(`[Socket.IO] Room message send attempt ${attempt + 1} failed:`, err);

          // If not the last attempt, wait before retrying
          if (attempt < maxRetries - 1) {
            await sleep(timeouts[attempt]);
          } else {
            // All retries exhausted
            throw new Error("Failed to send room message after retries");
          }
        }
      }

      throw new Error("Failed to send room message");
    },
    []
  );

  // Join conversation
  const joinConversation = useCallback((conversationId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("conversation:join", conversationId);
      activeConversationsRef.current.add(conversationId);
      console.log("[Socket.IO] Joined conversation:", conversationId);
    }
  }, []);

  // Leave conversation
  const leaveConversation = useCallback((conversationId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("conversation:leave", conversationId);
      activeConversationsRef.current.delete(conversationId);
      console.log("[Socket.IO] Left conversation:", conversationId);
    }
  }, []);

  // Join room
  const joinRoom = useCallback((roomId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("room:join", roomId);
      activeRoomsRef.current.add(roomId);
      console.log("[Socket.IO] Joined room:", roomId);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("room:leave", roomId);
      activeRoomsRef.current.delete(roomId);
      console.log("[Socket.IO] Left room:", roomId);
    }
  }, []);

  // Register message callback
  const onMessage = useCallback((callback: MessageCallback) => {
    messageCallbacksRef.current.add(callback);
    return () => {
      messageCallbacksRef.current.delete(callback);
    };
  }, []);

  // Register room message callback
  const onRoomMessage = useCallback((callback: MessageCallback) => {
    roomMessageCallbacksRef.current.add(callback);
    return () => {
      roomMessageCallbacksRef.current.delete(callback);
    };
  }, []);

  // Register typing callback
  const onTyping = useCallback((callback: TypingCallback) => {
    typingCallbacksRef.current.add(callback);
    return () => {
      typingCallbacksRef.current.delete(callback);
    };
  }, []);

  // Register presence callback
  const onPresence = useCallback((callback: PresenceCallback) => {
    presenceCallbacksRef.current.add(callback);
    return () => {
      presenceCallbacksRef.current.delete(callback);
    };
  }, []);

  // Start typing indicator
  const startTyping = useCallback((conversationId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("typing:start", conversationId);
    }
  }, []);

  // Stop typing indicator
  const stopTyping = useCallback((conversationId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("typing:stop", conversationId);
    }
  }, []);

  // Register message deleted callback
  const onMessageDeleted = useCallback((callback: MessageDeletedCallback) => {
    messageDeletedCallbacksRef.current.add(callback);
    return () => {
      messageDeletedCallbacksRef.current.delete(callback);
    };
  }, []);

  // Send message deleted notification
  const sendMessageDeleted = useCallback((messageId: number) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("message:deleted", messageId);
    }
  }, []);

  return {
    connected: connectionState === "connected",
    connecting: connectionState === "connecting",
    connectionState,
    error,
    sendMessage,
    sendRoomMessage,
    joinConversation,
    leaveConversation,
    joinRoom,
    leaveRoom,
    onMessage,
    onRoomMessage,
    onTyping,
    onPresence,
    onMessageDeleted,
    sendMessageDeleted,
    startTyping,
    stopTyping,
  };
}
