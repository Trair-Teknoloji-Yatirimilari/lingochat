import React from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface ProfilePictureDisplayProps {
  profilePictureUrl?: string | null;
  username?: string;
  onChangePress?: () => void;
  onDeletePress?: () => void;
  loading?: boolean;
  size?: "small" | "medium" | "large";
}

export function ProfilePictureDisplay({
  profilePictureUrl,
  username,
  onChangePress,
  onDeletePress,
  loading = false,
  size = "medium",
}: ProfilePictureDisplayProps) {
  const colors = useColors();

  const sizeMap = {
    small: 60,
    medium: 100,
    large: 150,
  };

  const pictureSize = sizeMap[size];

  return (
    <View className="items-center gap-3">
      {/* Profile Picture Container */}
      <View
        style={{
          width: pictureSize,
          height: pictureSize,
          borderRadius: pictureSize / 2,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-surface">
            <Text className="text-4xl">👤</Text>
          </View>
        )}
      </View>

      {/* Username */}
      {username && (
        <Text className="text-lg font-semibold text-foreground">{username}</Text>
      )}

      {/* Action Buttons */}
      {(onChangePress || onDeletePress) && (
        <View className="flex-row gap-2">
          {onChangePress && (
            <Pressable
              onPress={onChangePress}
              disabled={loading}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.8 : 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-background font-semibold">
                {profilePictureUrl ? "Değiştir" : "Yükle"}
              </Text>
            </Pressable>
          )}

          {onDeletePress && profilePictureUrl && (
            <Pressable
              onPress={onDeletePress}
              disabled={loading}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.error,
                  opacity: pressed || loading ? 0.8 : 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-background font-semibold">Sil</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
