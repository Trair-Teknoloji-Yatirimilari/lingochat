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
  FadeIn,
  SlideInRight,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

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
            renderItem={({ item, index }) => (
              <Animated.View
                entering={SlideInRight.delay(index * 100).springify()}
              >
                <ConversationCard
                  conversation={item}
                  onPress={() =>
                    router.push({
                      pathname: "/chat-detail",
                      params: { conversationId: item.id },
                    })
                  }
                />
              </Animated.View>
            )}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
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
  const translateX = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Karşı tarafın ID'sini bul
  const otherUserId =
    conversation.participant1Id === user?.id
      ? conversation.participant2Id
      : conversation.participant1Id;

  // Use mock data if available, otherwise use defaults
  const isOnline = conversation.isOnline ?? Math.random() > 0.5;
  const unreadCount = conversation.unreadCount ?? Math.floor(Math.random() * 5);
  const lastMessage = conversation.lastMessage ?? "Son mesaj burada görünecek...";
  const lastMessageTime = conversation.lastMessageTime ?? "14:30";
  const otherUserName = conversation.otherUserName ?? `User ${otherUserId}`;
  const otherUserAvatar = conversation.otherUserAvatar;

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Sadece sola kaydırmaya izin ver
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -80);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -40) {
        // Silme eşiğine ulaşıldı
        translateX.value = withSpring(-80);
      } else {
        // Geri dön
        translateX.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value },
    ],
  }));

  const animatedDeleteStyle = useAnimatedStyle(() => ({
    opacity: Math.abs(translateX.value) / 80,
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1);
  };

  const handleDelete = () => {
    Alert.alert(
      "Sohbeti Sil",
      "Bu sohbeti silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive" },
      ]
    );
  };

  return (
    <View style={{ position: "relative" }}>
      {/* Delete Button (Behind) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            backgroundColor: colors.error,
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
          },
          animatedDeleteStyle,
        ]}
      >
        <TouchableOpacity onPress={handleDelete} style={{ padding: 20 }}>
          <Ionicons name="trash" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedCardStyle}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border + "40",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Profile Picture with Online Status */}
            <View style={{ position: "relative" }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {otherUserAvatar ? (
                  <Image
                    source={{ uri: otherUserAvatar }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 28 }}>👤</Text>
                )}
              </View>
              
              {/* Online Status Indicator */}
              {isOnline && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: colors.success,
                    borderWidth: 2,
                    borderColor: colors.surface,
                  }}
                />
              )}
            </View>

            {/* Conversation Info */}
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                  numberOfLines={1}
                >
                  {otherUserName}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                  }}
                >
                  {lastMessageTime}
                </Text>
              </View>
              
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: colors.muted,
                  }}
                  numberOfLines={1}
                >
                  {lastMessage}
                </Text>
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      paddingHorizontal: 6,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {unreadCount}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
