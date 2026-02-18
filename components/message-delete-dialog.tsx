import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

interface MessageDeleteDialogProps {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export function MessageDeleteDialog({
  visible,
  loading = false,
  onConfirm,
  onCancel,
  message = "Bu mesajı silmek istediğinizden emin misiniz?",
}: MessageDeleteDialogProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 20,
            width: "80%",
            maxWidth: 300,
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Mesajı Sil
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            {/* Cancel Button */}
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.border,
                  opacity: pressed || loading ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontWeight: "500",
                  fontSize: 14,
                }}
              >
                İptal
              </Text>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: pressed || loading ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                },
              ]}
            >
              {loading && (
                <ActivityIndicator color={colors.background} size="small" />
              )}
              <Text
                style={{
                  color: colors.background,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Sil
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
