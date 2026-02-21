import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import React, { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function GroupsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Animation values
  const scale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  // Fetch user's active rooms
  const { data: myRooms, isLoading, refetch } = trpc.groups.getMyRooms.useQuery();
  const joinRoomMutation = trpc.groups.joinRoom.useMutation();

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateRoom = () => {
    router.push("/create-room" as any);
  };

  const handleJoinWithCode = async () => {
    if (roomCode.length !== 6) {
      Alert.alert(t('common.error'), "Please enter the 6-digit room code");
      return;
    }

    setJoining(true);
    try {
      const result = await joinRoomMutation.mutateAsync({ roomCode });
      
      if (result.success) {
        setRoomCode("");
        refetch();
        
        // Navigate to room detail
        if (result.room?.id) {
          router.push(`/room-detail?roomId=${result.room.id}` as any);
        } else {
          Alert.alert(t('common.success'), result.message || "You joined the room");
        }
      } else {
        Alert.alert(t('common.error'), result.message || "Could not join room");
      }
    } catch (error) {
      console.error("Join room error:", error);
      Alert.alert(t('common.error'), t('errors.serverError'));
    } finally {
      setJoining(false);
    }
  };

  const handleRoomPress = (roomId: number) => {
    router.push(`/room-detail?roomId=${roomId}` as any);
  };

  // Filter rooms based on search query
  const filteredRooms = myRooms?.filter((room) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const roomName = room.name?.toLowerCase() || "";
    const roomCode = room.roomCode?.toLowerCase() || "";
    
    return roomName.includes(query) || roomCode.includes(query);
  }) || [];

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="p-6 pb-3">
          <Text className="text-2xl font-bold text-foreground">{t('tabs.groups')}</Text>
          <Text className="text-sm text-muted mt-1">
            Break language barriers, talk to the world
          </Text>
        </View>

        {/* Action Buttons - Yan Yana */}
        <View className="px-6 pb-4 flex-row gap-3">
          <Animated.View style={[{ flex: 1 }, animatedButtonStyle]}>
            <TouchableOpacity
              onPress={handleCreateRoom}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Animated.View style={animatedIconStyle}>
                <Ionicons name="add-circle" size={20} color="#ffffff" />
              </Animated.View>
              <Text className="text-white font-semibold text-sm">{t('groups.newGroup')}</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => {
              // Kod ile katıl modal'ını aç
              Alert.prompt(
                "Join with Code",
                "Enter the 6-digit room code",
                [
                  { text: t('common.cancel'), style: "cancel" },
                  {
                    text: "Join",
                    onPress: async (code?: string) => {
                      if (code && code.length === 6) {
                        setJoining(true);
                        try {
                          const result = await joinRoomMutation.mutateAsync({ roomCode: code.toUpperCase() });
                          if (result.success && result.room?.id) {
                            router.push(`/room-detail?roomId=${result.room.id}` as any);
                          } else {
                            Alert.alert(t('common.error'), result.message || "Could not join room");
                          }
                        } catch (error) {
                          Alert.alert(t('common.error'), t('errors.serverError'));
                        } finally {
                          setJoining(false);
                        }
                      } else {
                        Alert.alert(t('common.error'), "Please enter 6-digit code");
                      }
                    },
                  },
                ],
                "plain-text",
                "",
                "default"
              );
            }}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="key-outline" size={20} color={colors.primary} />
            <Text className="font-semibold text-sm" style={{ color: colors.primary }}>
              Join with Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {myRooms && myRooms.length > 0 && (
          <View className="px-6 pb-4">
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput
                placeholder="Search room name or code..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.foreground,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Active Rooms Section */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-foreground">Active Rooms</Text>
            {myRooms && myRooms.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary }}>
                  {searchQuery ? filteredRooms.length : myRooms.length}
                </Text>
              </View>
            )}
          </View>
          
          {isLoading ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ActivityIndicator color={colors.primary} size="small" />
              <Text className="text-xs text-muted mt-3">{t('common.loading')}</Text>
            </View>
          ) : filteredRooms.length > 0 ? (
            <View className="gap-2">
              {filteredRooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  onPress={() => handleRoomPress(room.id)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: colors.primary + "15",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="people" size={18} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                            {room.name}
                          </Text>
                          {room.isModerator && (
                            <View
                              style={{
                                backgroundColor: colors.primary + "20",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 9, fontWeight: "700", color: colors.primary }}>
                                MOD
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center gap-3 mt-1">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="key" size={11} color={colors.muted} />
                            <Text className="text-xs text-muted font-mono">{room.roomCode}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="people-outline" size={11} color={colors.muted} />
                            <Text className="text-xs text-muted">Max {room.maxParticipants}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : searchQuery ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.muted + "15",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="search-outline" size={28} color={colors.muted} />
              </View>
              <Text className="text-sm font-semibold text-foreground mb-1">
                {t('groups.noResults')}
              </Text>
              <Text className="text-xs text-muted text-center">
                "{searchQuery}" {t('groups.noResultsDescription')}
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary + "15",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="people-outline" size={28} color={colors.primary} />
              </View>
              <Text className="text-sm font-semibold text-foreground mb-1">
                {t('groups.noRooms')}
              </Text>
              <Text className="text-xs text-muted text-center">
                {t('groups.noRoomsDescription')}
              </Text>
            </View>
          )}
        </View>

        {/* Info Cards - Daha Kompakt */}
        <View className="px-6 py-6 gap-3">
          <View
            style={{
              backgroundColor: colors.primary + "08",
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              gap: 10,
              borderWidth: 1,
              borderColor: colors.primary + "20",
            }}
          >
            <Ionicons name="language" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-0.5">
                {t('groups.autoTranslation')}
              </Text>
              <Text className="text-xs text-muted" style={{ fontSize: 11 }}>
                {t('groups.autoTranslationDescription')}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.primary + "08",
              borderRadius: 10,
              padding: 12,
              flexDirection: "row",
              gap: 10,
              borderWidth: 1,
              borderColor: colors.primary + "20",
            }}
          >
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-0.5">
                {t('groups.securePrivate')}
              </Text>
              <Text className="text-xs text-muted" style={{ fontSize: 11 }}>
                {t('groups.securePrivateDescription')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
