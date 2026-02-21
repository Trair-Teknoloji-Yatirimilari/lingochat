import React from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";

interface ProfilePictureDisplayProps {
  profilePictureUrl?: string | null;
  username?: string;
  onChangePress?: () => void;
  onDeletePress?: () => void;
  loading?: boolean;
  size?: "small" | "medium" | "large";
  showButtons?: boolean;
}

export function ProfilePictureDisplay({
  profilePictureUrl,
  username,
  onChangePress,
  onDeletePress,
  loading = false,
  size = "medium",
  showButtons = true,
}: ProfilePictureDisplayProps) {
  const colors = useColors();

  const sizeMap = {
    small: 60,
    medium: 100,
    large: 120,
  };

  const pictureSize = sizeMap[size];

  return (
    <View className="items-center">
      {/* Profile Picture Container with Edit Button */}
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: pictureSize,
            height: pictureSize,
            borderRadius: pictureSize / 2,
            backgroundColor: colors.surface,
            borderWidth: 3,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="person" size={pictureSize * 0.5} color={colors.muted} />
            </View>
          )}
        </View>

        {/* Floating Edit Button */}
        {showButtons && onChangePress && (
          <TouchableOpacity
            onPress={onChangePress}
            disabled={loading}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: colors.primary,
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 3,
              borderColor: "#ffffff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="camera" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Delete Button (if picture exists) - Icon only */}
      {showButtons && onDeletePress && profilePictureUrl && (
        <TouchableOpacity
          onPress={onDeletePress}
          disabled={loading}
          style={{
            marginTop: 12,
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(220, 38, 38, 0.2)",
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      )}
    </View>
  );
}
