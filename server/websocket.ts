import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import * as db from "./db";

interface WebSocketMessage {
  type: "message" | "typing" | "online" | "offline" | "message_deleted";
  conversationId: number;
  userId: number;
  data?: any;
  messageId?: number;
}

interface UserConnection {
  ws: WebSocket;
  userId: number;
  conversationIds: Set<number>;
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
  const { type, conversationId, userId } = message;

  switch (type) {
    case "message":
      await handleMessageSend(ws, message);
      break;
    case "typing":
      broadcastToConversation(conversationId, {
        type: "typing",
        userId,
      });
      break;
    case "online":
      registerUserConnection(ws, userId, conversationId);
      broadcastToConversation(conversationId, {
        type: "online",
        userId,
      });
      break;
    case "message_deleted":
      handleMessageDelete(conversationId, message.messageId, userId);
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
    };
    userConnections.set(userId, connection);
  }

  connection.conversationIds.add(conversationId);
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

export { broadcastToConversation, broadcastToConversations };
