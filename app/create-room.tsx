import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function CreateRoomScreen() {
  const router = useRouter();
  const colors = useColors();
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("50");
  const [loading, setLoading] = useState(false);

  const createRoomMutation = trpc.groups.createRoom.useMutation();
  const utils = trpc.useContext();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert("Hata", "Lütfen oda adı girin");
      return;
    }

    if (roomName.trim().length < 3) {
      Alert.alert("Hata", "Oda adı en az 3 karakter olmalıdır");
      return;
    }

    setLoading(true);
    
    try {
      const result = await createRoomMutation.mutateAsync({
        name: roomName.trim(),
        description: description.trim() || undefined,
        maxParticipants: parseInt(maxParticipants),
      });

      if (result.success && result.room) {
        const roomId = result.room.id;
        const roomCode = result.room.roomCode;
        
        Alert.alert(
          "Oda Oluşturuldu! 🎉",
          `Oda Kodu: ${roomCode}\n\nBu kodu arkadaşlarınızla paylaşarak onları odaya davet edebilirsiniz.`,
          [
            {
              text: "Odaya Git",
              onPress: () => {
                // Invalidate query to refresh groups list
                utils.groups.getMyRooms.invalidate();
                router.replace(`/room-detail?roomId=${roomId}` as any);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Create room error:", error);
      Alert.alert("Hata", "Oda oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Yeni Oda Oluştur</Text>
            <Text className="text-xs text-muted">Grup toplantısı başlat</Text>
          </View>
        </View>

        <View className="p-6 gap-6">
          {/* Room Name */}
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="chatbubbles" size={20} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground">Oda Adı *</Text>
            </View>
            <TextInput
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Örn: İş Toplantısı, Proje Görüşmesi"
              placeholderTextColor={colors.muted}
              maxLength={50}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Text className="text-xs text-muted mt-1">{roomName.length}/50 karakter</Text>
          </View>

          {/* Description */}
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground">Açıklama</Text>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Oda hakkında kısa bir açıklama (opsiyonel)"
              placeholderTextColor={colors.muted}
              maxLength={200}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            <Text className="text-xs text-muted mt-1">{description.length}/200 karakter</Text>
          </View>

          {/* Max Participants */}
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground">Maksimum Katılımcı</Text>
            </View>
            <View className="flex-row gap-3">
              {["10", "25", "50", "100"].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setMaxParticipants(value)}
                  style={{
                    flex: 1,
                    backgroundColor: maxParticipants === value ? colors.primary : colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: maxParticipants === value ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: maxParticipants === value ? "#ffffff" : colors.foreground,
                    }}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View
            style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              gap: 12,
            }}
          >
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-1">
                Otomatik Çeviri Aktif
              </Text>
              <Text className="text-xs text-muted">
                Odaya katılan herkes kendi dilinde mesajları okuyabilecek. Sistem otomatik olarak çeviri yapacak.
              </Text>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateRoom}
            disabled={loading || !roomName.trim()}
            style={{
              backgroundColor: !roomName.trim() ? colors.border : colors.primary,
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
              marginTop: 12,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                <Text className="text-white font-bold text-lg">Oda Oluştur</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
