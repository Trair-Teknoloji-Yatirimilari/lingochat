import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "./use-auth";

interface WebSocketMessage {
  type: "message" | "typing" | "online" | "offline" | "error" | "message_ack" | "message_deleted";
  conversationId?: number;
  userId?: number;
  messageId?: number;
  deletedBy?: number;
  deletedAt?: Date;
  data?: any;
}

export function useWebSocket(conversationId?: number) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const messageHandlers = useRef<Map<string, (msg: any) => void>>(new Map());

  const connect = useCallback(() => {
    if (!user || !conversationId) return;

    try {
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        // Send online message
        ws.send(
          JSON.stringify({
            type: "online",
            conversationId,
            userId: user.id,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("WebSocket message:", message);

          if (message.type === "message") {
            setMessages((prev) => [...prev, message.data]);
          }

          // Call registered handlers
          const handler = messageHandlers.current.get(message.type);
          if (handler) {
            handler(message);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }, [user, conversationId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback(
    (text: string, senderLanguage: string, recipientLanguage: string) => {
      if (!wsRef.current || !isConnected || !conversationId) {
        console.warn("WebSocket not connected");
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          conversationId,
          userId: user?.id,
          data: {
            text,
            senderLanguage,
            recipientLanguage,
          },
        })
      );
    },
    [isConnected, conversationId, user?.id]
  );

  const sendTyping = useCallback(() => {
    if (!wsRef.current || !isConnected || !conversationId) return;

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        conversationId,
        userId: user?.id,
      })
    );
  }, [isConnected, conversationId, user?.id]);

  const onMessage = useCallback((handler: (msg: any) => void) => {
    messageHandlers.current.set("message", handler);
  }, []);

  const onTyping = useCallback((handler: (msg: any) => void) => {
    messageHandlers.current.set("typing", handler);
  }, []);

  const onMessageDeleted = useCallback((handler: (msg: any) => void) => {
    messageHandlers.current.set("message_deleted", handler);
  }, []);

  const sendMessageDeleted = useCallback(
    (messageId: number) => {
      if (!wsRef.current || !isConnected || !conversationId) return;

      wsRef.current.send(
        JSON.stringify({
          type: "message_deleted",
          conversationId,
          userId: user?.id,
          messageId,
        })
      );
    },
    [isConnected, conversationId, user?.id]
  );

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    messages,
    sendMessage,
    sendTyping,
    sendMessageDeleted,
    onMessage,
    onTyping,
    onMessageDeleted,
  };
}
