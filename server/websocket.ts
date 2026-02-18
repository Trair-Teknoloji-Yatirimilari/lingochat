import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import * as db from "./db";

interface WebSocketMessage {
  type: "message" | "typing" | "online" | "offline" | "message_deleted" | "room:join" | "room:leave" | "room:message";
  conversationId?: number;
  roomId?: number;
  userId: number;
  data?: any;
  messageId?: number;
}

interface UserConnection {
  ws: WebSocket;
  userId: number;
  conversationIds: Set<number>;
  roomIds: Set<number>;
}

const userConnections = new Map<number, UserConnection>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);
        await handleMessage(ws, message);
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", error: "Invalid message" }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      // Remove user connection
      for (const [userId, connection] of userConnections.entries()) {
        if (connection.ws === ws) {
          userConnections.delete(userId);
          // Notify other users that this user went offline
          broadcastToConversations(
            Array.from(connection.conversationIds),
            {
              type: "offline",
              userId,
            }
          );
          break;
        }
      }
    });

    ws.on("error", (error: any) => {
      console.error("WebSocket error:", error);
    });
  });

  return wss;
}

async function handleMessage(ws: WebSocket, message: WebSocketMessage) {
  const { type, conversationId, roomId, userId } = message;

  switch (type) {
    case "message":
      await handleMessageSend(ws, message);
      break;
    case "typing":
      if (conversationId) {
        broadcastToConversation(conversationId, {
          type: "typing",
          userId,
        });
      }
      break;
    case "online":
      if (conversationId) {
        registerUserConnection(ws, userId, conversationId);
        broadcastToConversation(conversationId, {
          type: "online",
          userId,
        });
      }
      break;
    case "message_deleted":
      if (conversationId) {
        handleMessageDelete(conversationId, message.messageId, userId);
      }
      break;
    case "room:join":
      if (roomId) {
        registerRoomConnection(ws, userId, roomId);
        broadcastToRoom(roomId, {
          type: "room:user_joined",
          userId,
        });
      }
      break;
    case "room:leave":
      if (roomId) {
        unregisterRoomConnection(userId, roomId);
        broadcastToRoom(roomId, {
          type: "room:user_left",
          userId,
        });
      }
      break;
    case "room:message":
      if (roomId) {
        await handleRoomMessage(ws, message);
      }
      break;
    default:
      console.warn("Unknown message type:", type);
  }
}

async function handleMessageSend(ws: WebSocket, message: WebSocketMessage) {
  const { conversationId, userId, data } = message;

  try {
    // Save message to database
    const savedMessage = await db.createMessage({
      conversationId,
      senderId: userId,
      originalText: data.text,
      senderLanguage: data.senderLanguage || "tr",
      recipientLanguage: data.recipientLanguage || "en",
      isTranslated: false,
    });

    // Broadcast message to all users in conversation
    broadcastToConversation(conversationId, {
      type: "message",
      data: {
        id: savedMessage.id,
        conversationId,
        senderId: userId,
        originalText: data.text,
        translatedText: data.translatedText,
        senderLanguage: data.senderLanguage,
        recipientLanguage: data.recipientLanguage,
        createdAt: savedMessage.createdAt,
      },
    });

    // Send acknowledgment
    ws.send(
      JSON.stringify({
        type: "message_ack",
        messageId: savedMessage.id,
      })
    );
  } catch (error) {
    console.error("Failed to save message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        error: "Failed to save message",
      })
    );
  }
}

function registerUserConnection(
  ws: WebSocket,
  userId: number,
  conversationId: number
) {
  let connection = userConnections.get(userId);

  if (!connection) {
    connection = {
      ws,
      userId,
      conversationIds: new Set(),
      roomIds: new Set(),
    };
    userConnections.set(userId, connection);
  }

  connection.conversationIds.add(conversationId);
}

function registerRoomConnection(
  ws: WebSocket,
  userId: number,
  roomId: number
) {
  let connection = userConnections.get(userId);

  if (!connection) {
    connection = {
      ws,
      userId,
      conversationIds: new Set(),
      roomIds: new Set(),
    };
    userConnections.set(userId, connection);
  }

  connection.roomIds.add(roomId);
}

function unregisterRoomConnection(userId: number, roomId: number) {
  const connection = userConnections.get(userId);
  if (connection) {
    connection.roomIds.delete(roomId);
  }
}

function broadcastToConversation(conversationId: number, message: any) {
  const messageData = JSON.stringify(message);

  for (const [, connection] of userConnections.entries()) {
    if (connection.conversationIds.has(conversationId)) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageData);
      }
    }
  }
}

function broadcastToConversations(conversationIds: number[], message: any) {
  const messageData = JSON.stringify(message);

  for (const [, connection] of userConnections.entries()) {
    for (const convId of conversationIds) {
      if (connection.conversationIds.has(convId)) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(messageData);
        }
        break;
      }
    }
  }
}

function handleMessageDelete(
  conversationId: number,
  messageId: number | undefined,
  userId: number
) {
  if (!messageId) return;

  // Broadcast to all users in conversation
  broadcastToConversation(conversationId, {
    type: "message_deleted",
    messageId,
    deletedBy: userId,
    deletedAt: new Date(),
  });
}

async function handleRoomMessage(ws: WebSocket, message: WebSocketMessage) {
  const { roomId, userId, data } = message;
  if (!roomId) return;

  try {
    // Save message to database
    const savedMessage = await db.createGroupMessage({
      roomId,
      senderId: userId,
      originalText: data.text,
      originalLanguage: data.language || "tr",
    });

    // Broadcast message to all users in room
    broadcastToRoom(roomId, {
      type: "room:message",
      data: {
        id: savedMessage.id,
        roomId,
        senderId: userId,
        originalText: data.text,
        originalLanguage: data.language,
        createdAt: savedMessage.createdAt,
      },
    });

    // Send acknowledgment
    ws.send(
      JSON.stringify({
        type: "room:message_ack",
        messageId: savedMessage.id,
      })
    );
  } catch (error) {
    console.error("Failed to save room message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        error: "Failed to save message",
      })
    );
  }
}

function broadcastToRoom(roomId: number, message: any) {
  const messageData = JSON.stringify(message);

  for (const [, connection] of userConnections.entries()) {
    if (connection.roomIds.has(roomId)) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageData);
      }
    }
  }
}

export { broadcastToConversation, broadcastToConversations, broadcastToRoom };
