import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export default function GroupsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's active rooms
  const { data: myRooms, isLoading, refetch } = trpc.groups.getMyRooms.useQuery();
  const joinRoomMutation = trpc.groups.joinRoom.useMutation();

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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
      Alert.alert("Hata", "Lütfen 6 haneli oda kodunu girin");
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
          Alert.alert("Başarılı", result.message || "Odaya katıldınız");
        }
      } else {
        Alert.alert("Hata", result.message || "Odaya katılınamadı");
      }
    } catch (error) {
      console.error("Join room error:", error);
      Alert.alert("Hata", "Bir hata oluştu");
    } finally {
      setJoining(false);
    }
  };

  const handleRoomPress = (roomId: number) => {
    router.push(`/room-detail?roomId=${roomId}` as any);
  };

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
          <Text className="text-2xl font-bold text-foreground">Gruplar</Text>
          <Text className="text-sm text-muted mt-1">
            Dil engelini aşın, dünyayla konuşun
          </Text>
        </View>

        {/* Action Buttons - Yan Yana */}
        <View className="px-6 pb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={handleCreateRoom}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text className="text-white font-semibold text-sm">Yeni Oda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Kod ile katıl modal'ını aç
              Alert.prompt(
                "Kod ile Katıl",
                "6 haneli oda kodunu girin",
                [
                  { text: "İptal", style: "cancel" },
                  {
                    text: "Katıl",
                    onPress: async (code?: string) => {
                      if (code && code.length === 6) {
                        setJoining(true);
                        try {
                          const result = await joinRoomMutation.mutateAsync({ roomCode: code.toUpperCase() });
                          if (result.success && result.room?.id) {
                            router.push(`/room-detail?roomId=${result.room.id}` as any);
                          } else {
                            Alert.alert("Hata", result.message || "Odaya katılınamadı");
                          }
                        } catch (error) {
                          Alert.alert("Hata", "Bir hata oluştu");
                        } finally {
                          setJoining(false);
                        }
                      } else {
                        Alert.alert("Hata", "Lütfen 6 haneli kod girin");
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
              Kod ile Katıl
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Rooms Section */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-foreground">Aktif Odalar</Text>
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
                  {myRooms.length}
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
              <Text className="text-xs text-muted mt-3">Yükleniyor...</Text>
            </View>
          ) : myRooms && myRooms.length > 0 ? (
            <View className="gap-2">
              {myRooms.map((room) => (
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
                Henüz Oda Yok
              </Text>
              <Text className="text-xs text-muted text-center">
                Yeni bir oda oluşturun veya kod ile katılın
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
                Otomatik Çeviri
              </Text>
              <Text className="text-xs text-muted" style={{ fontSize: 11 }}>
                Herkes kendi dilinde konuşur ve okur
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
                Güvenli ve Özel
              </Text>
              <Text className="text-xs text-muted" style={{ fontSize: 11 }}>
                Tüm mesajlarınız şifreli ve güvenli
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
