import React from "react";
import { View, Text, Image } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface MessageWithReceiptProps {
  id: number;
  text: string;
  isSent: boolean;
  timestamp: Date;
  isRead?: boolean;
  readBy?: { userId: number; readAt: Date }[];
  senderName?: string;
  translatedText?: string;
}

export function MessageWithReceipt({
  id,
  text,
  isSent,
  timestamp,
  isRead,
  readBy,
  senderName,
  translatedText,
}: MessageWithReceiptProps) {
  const colors = useColors();

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View
      className={`mb-3 flex-row ${isSent ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-xs rounded-2xl px-4 py-2 ${
          isSent
            ? "bg-primary"
            : "bg-surface"
        }`}
      >
        {/* Sender name for group chats */}
        {!isSent && senderName && (
          <Text className="text-xs font-semibold text-muted mb-1">
            {senderName}
          </Text>
        )}

        {/* Original message */}
        <Text
          className={`text-base ${
            isSent ? "text-background" : "text-foreground"
          }`}
        >
          {text}
        </Text>

        {/* Translated message */}
        {translatedText && translatedText !== text && (
          <Text
            className={`text-sm mt-1 ${
              isSent ? "text-background opacity-80" : "text-muted"
            }`}
          >
            {translatedText}
          </Text>
        )}

        {/* Time and read receipt */}
        <View className="flex-row items-center justify-end gap-1 mt-1">
          <Text
            className={`text-xs ${
              isSent ? "text-background opacity-70" : "text-muted"
            }`}
          >
            {formatTime(timestamp)}
          </Text>

          {/* Read receipt indicator */}
          {isSent && (
            <View className="flex-row gap-0.5">
              {isRead ? (
                <Text className="text-xs text-primary">✓✓</Text>
              ) : (
                <Text className="text-xs text-muted">✓</Text>
              )}
            </View>
          )}
        </View>

        {/* Show who read the message */}
        {isSent && readBy && readBy.length > 0 && (
          <Text className="text-xs text-muted mt-1">
            Okundu: {formatTime(readBy[0].readAt)}
          </Text>
        )}
      </View>
    </View>
  );
}
