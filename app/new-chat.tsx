import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";

export default function NewChatScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trpcUtils = trpc.useUtils();

  const createChatMutation = trpc.chat.create.useMutation({
    onSuccess: (chat: any) => {
      router.push(`/chat-detail?conversationId=${chat.id}`);
    },
    onError: (error: any) => {
      Alert.alert("Hata", error.message || "Sohbet oluşturulamadı");
    },
  });

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kullanıcı adı veya telefon numarası girin");
      return;
    }

    setIsSearching(true);
    try {
      const results = await trpcUtils.client.groups.searchUsers.query({
        query: searchText.trim(),
      });
      setSearchResults(results || []);
      
      if (results.length === 0) {
        Alert.alert("Sonuç Yok", "Kullanıcı bulunamadı");
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Hata", "Arama yapılırken bir hata oluştu");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (user: any) => {
    try {
      // Create chat with phone number
      createChatMutation.mutate({
        participantIdentifier: user.phoneNumber || user.username,
      });
    } catch (error) {
      console.error("Create chat error:", error);
      Alert.alert("Hata", "Sohbet oluşturulamadı");
    }
  };

  return (
    <ScreenContainer className="p-4">
      <View className="gap-4 flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">Yeni Sohbet</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-surface rounded-lg border border-border flex-row items-center px-4 py-3 gap-2">
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Kullanıcı adı veya telefon numarası..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            className="flex-1 text-foreground"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchText("");
              setSearchResults([]);
            }}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          onPress={handleSearch}
          disabled={isSearching || !searchText.trim()}
          style={{
            backgroundColor:
              isSearching || !searchText.trim() ? colors.border : colors.primary,
            borderRadius: 12,
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
              keyExtractor={(item) => item.userId.toString()}
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  onPress={() => handleSelectUser(item)}
                  isLoading={createChatMutation.isPending}
                />
              )}
              contentContainerStyle={{ gap: 8 }}
            />
          </View>
        )}

        {/* Empty State */}
        {!isSearching && searchResults.length === 0 && searchText.length === 0 && (
          <View className="flex-1 items-center justify-center gap-3">
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
            <View className="mt-4 gap-2">
              <Text className="text-sm text-muted text-center">Örnek aramalar:</Text>
              <Text className="text-sm text-foreground text-center">
                @test_turkish, @test_english
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function UserCard({
  user,
  onPress,
  isLoading,
}: {
  user: any;
  onPress: () => void;
  isLoading: boolean;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center gap-3">
        {user.profilePictureUrl ? (
          <Image
            source={{ uri: user.profilePictureUrl }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
            }}
          />
        ) : (
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
        )}
        
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">
            @{user.username}
          </Text>
          {user.phoneNumber && (
            <Text className="text-sm text-muted">{user.phoneNumber}</Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="chatbubble" size={20} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );
}
