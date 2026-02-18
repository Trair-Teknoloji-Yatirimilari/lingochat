import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";

interface LingoContact {
  userId: number;
  username: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  contactName?: string;
}

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [lingoContacts, setLingoContacts] = useState<LingoContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const trpcUtils = trpc.useUtils();

  // Request contacts permission and load LingoChat users
  useEffect(() => {
    loadLingoContacts();
  }, []);

  const loadLingoContacts = async () => {
    try {
      setIsLoading(true);

      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== "granted") {
        setHasPermission(false);
        Alert.alert(
          "İzin Gerekli",
          "Rehberinizdeki LingoChat kullanıcılarını görmek için rehber iznine ihtiyacımız var."
        );
        setIsLoading(false);
        return;
      }

      setHasPermission(true);

      // Get all contacts with phone numbers
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (!data || data.length === 0) {
        setIsLoading(false);
        return;
      }

      // Extract all phone numbers from contacts
      const phoneNumbers: { number: string; name: string }[] = [];
      data.forEach((contact) => {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          contact.phoneNumbers.forEach((phone) => {
            if (phone.number) {
              // Clean phone number (remove spaces, dashes, etc.)
              const cleanNumber = phone.number.replace(/[\s\-\(\)]/g, "");
              phoneNumbers.push({
                number: cleanNumber,
                name: contact.name || "Unknown",
              });
            }
          });
        }
      });

      // Search for each phone number in LingoChat
      const lingoUsers: LingoContact[] = [];
      const searchPromises = phoneNumbers.map(async ({ number, name }: { number: string; name: string }) => {
        try {
          const result = await trpcUtils.client.groups.searchUsers.query({ query: number });
          if (result && result.length > 0) {
            // Add contact name to the result
            result.forEach((user: any) => {
              lingoUsers.push({
                ...user,
                contactName: name,
              });
            });
          }
        } catch (error) {
          // Silently ignore errors for individual searches
        }
      });

      await Promise.all(searchPromises);

      // Remove duplicates based on userId
      const uniqueUsers = Array.from(
        new Map(lingoUsers.map((user) => [user.userId, user])).values()
      );

      setLingoContacts(uniqueUsers);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading LingoChat contacts:", error);
      Alert.alert("Hata", "Rehber yüklenirken bir hata oluştu");
      setIsLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleStartChat = (userId: number) => {
    router.push({
      pathname: "/chat-detail",
      params: { userId },
    });
  };

  // Filter contacts based on search query
  const filteredContacts = searchQuery.trim()
    ? lingoContacts.filter(
        (contact) =>
          contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumber.includes(searchQuery)
      )
    : lingoContacts;

  return (
    <ScreenContainer>
      <View className="flex-1 p-6 gap-6">
        {/* Header */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Sesli Arama</Text>
          <Text className="text-sm text-muted">
            Rehberinizdeki LingoChat kullanıcılarını arayın
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
            placeholder="İsim veya kullanıcı adı ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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

        {/* Refresh Button */}
        {hasPermission && !isLoading && (
          <TouchableOpacity
            onPress={loadLingoContacts}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Rehberi Yenile
            </Text>
          </TouchableOpacity>
        )}

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center gap-4">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-base text-muted">
              Rehber taranıyor...
            </Text>
          </View>
        )}

        {/* Contacts List */}
        {!isLoading && hasPermission && filteredContacts.length > 0 && (
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground mb-3">
              LingoChat Kişileri ({filteredContacts.length})
            </Text>
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.userId.toString()}
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
                    {item.profilePictureUrl ? (
                      <Image
                        source={{ uri: item.profilePictureUrl }}
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
                      {item.contactName && (
                        <Text className="text-base font-bold text-foreground">
                          {item.contactName}
                        </Text>
                      )}
                      <Text
                        className="text-sm"
                        style={{
                          color: item.contactName ? colors.muted : colors.foreground,
                          fontWeight: item.contactName ? "normal" : "bold",
                        }}
                      >
                        @{item.username}
                      </Text>
                      <Text className="text-xs text-muted">{item.phoneNumber}</Text>
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
                      <Text className="text-white font-semibold text-sm">
                        Sesli Ara
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStartChat(item.userId)}
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

        {/* Empty State - No Permission */}
        {!isLoading && !hasPermission && (
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
              <Ionicons name="people" size={40} color={colors.primary} />
            </View>
            <Text className="text-base text-muted text-center px-8">
              Rehber iznine ihtiyacımız var
            </Text>
            <TouchableOpacity
              onPress={loadLingoContacts}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text className="text-white font-semibold">İzin Ver</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State - No Contacts */}
        {!isLoading && hasPermission && filteredContacts.length === 0 && (
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
              <Ionicons name="people-outline" size={40} color={colors.primary} />
            </View>
            <Text className="text-base text-muted text-center px-8">
              {searchQuery.trim()
                ? "Arama sonucu bulunamadı"
                : "Rehberinizde LingoChat kullanıcısı bulunamadı"}
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
