import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function ChatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();

  const conversationsQuery = trpc.chat.list.useQuery();

  // Animation values
  const scale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  const handleNewChat = () => {
    router.push({
      pathname: "/new-chat",
    });
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Animated styles for button
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Icon rotation animation
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  // Start icon animation on mount
  React.useEffect(() => {
    iconRotation.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(90, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );
  }, []);

  if (conversationsQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const conversations = conversationsQuery.data || [];

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">Sohbetler</Text>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              onPress={handleNewChat}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 50,
                padding: 12,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Animated.View style={animatedIconStyle}>
                <Ionicons name="add" size={24} color={colors.background} />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
            <Text className="text-muted text-center text-base">
              Henüz sohbet yok
            </Text>
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                onPress={handleNewChat}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Animated.View style={animatedIconStyle}>
                  <Ionicons name="add-circle" size={24} color={colors.background} />
                </Animated.View>
                <Text
                  style={{
                    color: colors.background,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Sohbet Başlat
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() =>
                  router.push({
                    pathname: "/chat-detail",
                    params: { conversationId: item.id },
                  })
                }
              />
            )}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 8 }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: any;
  onPress: () => void;
}) {
  const colors = useColors();
  const { user } = useAuth();

  // Karşı tarafın ID'sini bul
  const otherUserId =
    conversation.participant1Id === user?.id
      ? conversation.participant2Id
      : conversation.participant1Id;

  // Karşı tarafın profilini al (şimdilik placeholder)
  const otherUserProfile = null; // TODO: Backend'den profil bilgisi çek

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-lg p-4 border border-border flex-row items-center gap-3"
    >
      {/* Profile Picture */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.border,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {otherUserProfile?.profilePictureUrl ? (
          <Image
            source={{ uri: otherUserProfile.profilePictureUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-2xl">👤</Text>
        )}
      </View>

      {/* Conversation Info */}
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-foreground">
          User {otherUserId}
        </Text>
        <Text className="text-sm text-muted">
          {new Date(conversation.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}
