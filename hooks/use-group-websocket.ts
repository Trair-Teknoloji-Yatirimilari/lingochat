import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "./use-auth";
import Constants from "expo-constants";

interface GroupMessage {
  id: number;
  roomId: number;
  senderId: number;
  originalText: string;
  originalLanguage: string;
  createdAt: Date;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  userId?: number;
  messageId?: number;
}

export function useGroupWebSocket(roomId: number | null) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [participants, setParticipants] = useState<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // WebSocket temporarily disabled - using HTTP polling instead
    console.log("[GroupWS] WebSocket disabled, using HTTP polling");
    return;
    
    if (!roomId || !user) return;

    // Get WebSocket URL based on platform
    let wsUrl: string;
    
    if (Platform.OS === "web") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}`;
    } else {
      // React Native - use API base URL
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000";
      wsUrl = apiUrl.replace("http://", "ws://").replace("https://", "wss://");
    }
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[GroupWS] Connected");
        setConnected(true);

        // Join room
        ws.send(
          JSON.stringify({
            type: "room:join",
            roomId,
            userId: user.id,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("[GroupWS] Parse error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[GroupWS] Error:", error);
      };

      ws.onclose = () => {
        console.log("[GroupWS] Disconnected");
        setConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          // Leave room before closing
          ws.send(
            JSON.stringify({
              type: "room:leave",
              roomId,
              userId: user.id,
            })
          );
        }
        ws.close();
      };
    } catch (error) {
      console.error("[GroupWS] Connection error:", error);
    }
  }, [roomId, user]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "room:message":
        if (message.data) {
          setMessages((prev) => [...prev, message.data]);
        }
        break;

      case "room:user_joined":
        if (message.userId) {
          setParticipants((prev) => [...new Set([...prev, message.userId!])]);
        }
        break;

      case "room:user_left":
        if (message.userId) {
          setParticipants((prev) => prev.filter((id) => id !== message.userId));
        }
        break;

      case "room:message_ack":
        console.log("[GroupWS] Message acknowledged:", message.messageId);
        break;

      default:
        console.log("[GroupWS] Unknown message type:", message.type);
    }
  };

  const sendMessage = (text: string, language: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("[GroupWS] Not connected");
      return false;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "room:message",
        roomId,
        userId: user?.id,
        data: {
          text,
          language,
        },
      })
    );

    return true;
  };

  return {
    connected,
    messages,
    participants,
    sendMessage,
  };
}
