import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kullanıcı adı veya telefon numarası girin");
      return;
    }

    setIsSearching(true);
    // Simulated search - replace with actual API call
    setTimeout(() => {
      setSearchResults([
        {
          id: 1,
          username: "demo_user",
          phoneNumber: "+90 555 123 4567",
          profilePictureUrl: null,
        },
      ]);
      setIsSearching(false);
    }, 1000);
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\s/g, "");
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleStartChat = (userId: number) => {
    router.push({
      pathname: "/new-chat",
      params: { userId },
    });
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-6 gap-6">
        {/* Header */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Ara</Text>
          <Text className="text-sm text-muted">
            Kullanıcı adı veya telefon numarası ile arama yapın
          </Text>
        </View>

        {/* Search Input */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Kullanıcı adı veya telefon..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={{
              flex: 1,
              fontSize: 16,
              color: colors.foreground,
            }}
            placeholderTextColor={colors.muted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          onPress={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          style={{
            backgroundColor:
              isSearching || !searchQuery.trim() ? colors.border : colors.primary,
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
          }}
        >
          {isSearching ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="search" size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base">Ara</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-3">
              Sonuçlar ({searchResults.length})
            </Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 12,
                  }}
                >
                  <View className="flex-row items-center gap-3 mb-3">
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary + "20",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">
                        @{item.username}
                      </Text>
                      <Text className="text-sm text-muted">{item.phoneNumber}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleCall(item.phoneNumber)}
                      style={{
                        flex: 1,
                        backgroundColor: colors.primary,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="call" size={18} color="#ffffff" />
                      <Text className="text-white font-semibold text-sm">Ara</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStartChat(item.id)}
                      style={{
                        flex: 1,
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Ionicons name="chatbubble" size={18} color={colors.primary} />
                      <Text
                        className="font-semibold text-sm"
                        style={{ color: colors.primary }}
                      >
                        Mesaj
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Empty State */}
        {!isSearching && searchResults.length === 0 && searchQuery.length === 0 && (
          <View className="flex-1 items-center justify-center gap-4">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="search" size={40} color={colors.primary} />
            </View>
            <Text className="text-base text-muted text-center px-8">
              Kullanıcı aramak için yukarıdaki arama kutusunu kullanın
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
