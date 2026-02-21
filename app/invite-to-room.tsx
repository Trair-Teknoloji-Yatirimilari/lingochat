import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";
import * as Contacts from "expo-contacts";

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: Array<{ number?: string }>;
}

interface LingoUser {
  userId: number;
  username: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  isSelected?: boolean;
}

export default function InviteToRoomScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const roomId = parseInt(params.roomId as string);

  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lingoUsers, setLingoUsers] = useState<LingoUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const { data: room } = trpc.groups.getRoom.useQuery({ roomId });
  const { data: participants } = trpc.groups.getParticipants.useQuery({ roomId });
  const inviteUsersMutation = trpc.groups.inviteUsers.useMutation();

  useEffect(() => {
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === "granted");
      
      if (status === "granted") {
        loadContacts();
      }
    } catch (error) {
      console.error("Permission error:", error);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        setContacts(data);
        // Check which contacts are LingoChat users
        await checkLingoUsers(data);
      }
    } catch (error) {
      console.error("Load contacts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLingoUsers = async (contactList: Contact[]) => {
    // Extract all phone numbers from contacts
    const phoneNumbers = contactList
      .flatMap((c) => c.phoneNumbers?.map((p) => p.number) || [])
      .filter((p) => p) as string[];

    // For now, we'll use search to find users
    // In production, you'd have a batch endpoint to check multiple phones
    // This is a simplified version
    setLingoUsers([]);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setLingoUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Search users by username or phone
      const searchMutation = trpc.groups.searchUsers.useQuery({ query });
      // Note: This is simplified, in real app you'd use proper query
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleInvite = async () => {
    if (selectedUsers.size === 0) {
      Alert.alert(t('common.error'), t('inviteToRoom.selectAtLeastOne'));
      return;
    }

    setInviting(true);
    try {
      const result = await inviteUsersMutation.mutateAsync({
        roomId,
        userIds: Array.from(selectedUsers),
      });

      if (result.success) {
        Alert.alert(
          t('inviteToRoom.inviteSuccess'),
          t('inviteToRoom.inviteSuccessMessage').replace('{count}', result.invited.toString()),
          [
            {
              text: t('common.done'),
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Invite error:", error);
      Alert.alert(t('common.error'), t('inviteToRoom.inviteError'));
    } finally {
      setInviting(false);
    }
  };

  const isParticipant = (userId: number) => {
    return participants?.some((p: any) => p.userId === userId);
  };

  return (
    <ScreenContainer>
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
          <Text className="text-xl font-bold text-foreground">{t('inviteToRoom.title')}</Text>
          {room && (
            <Text className="text-xs text-muted">{room.name}</Text>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View className="p-4">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder={t('inviteToRoom.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              padding: 12,
              fontSize: 15,
              color: colors.foreground,
            }}
          />
        </View>
      </View>

      {/* Permission Request */}
      {!hasPermission && (
        <View className="p-6 items-center">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="people" size={40} color={colors.primary} />
          </View>
          <Text className="text-lg font-bold text-foreground mb-2 text-center">
            {t('inviteToRoom.contactsPermissionTitle')}
          </Text>
          <Text className="text-sm text-muted text-center mb-4">
            {t('inviteToRoom.contactsPermissionDescription')}
          </Text>
          <TouchableOpacity
            onPress={requestContactsPermission}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text className="text-white font-semibold">{t('inviteToRoom.grantPermission')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Users List */}
      {hasPermission && (
        <ScrollView className="flex-1 px-4">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-4">{t('inviteToRoom.loading')}</Text>
            </View>
          ) : lingoUsers.length === 0 && searchQuery.length >= 2 ? (
            <View className="py-12 items-center">
              <Ionicons name="search-outline" size={48} color={colors.muted} />
              <Text className="text-base font-semibold text-foreground mt-4">
                {t('inviteToRoom.noUsersFound')}
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                {t('inviteToRoom.tryDifferentSearch')}
              </Text>
            </View>
          ) : searchQuery.length < 2 ? (
            <View className="py-12 items-center">
              <Ionicons name="people-outline" size={48} color={colors.muted} />
              <Text className="text-base font-semibold text-foreground mt-4">
                {t('inviteToRoom.searchUsers')}
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-8">
                {t('inviteToRoom.searchDescription')}
              </Text>
            </View>
          ) : (
            <View className="gap-2 pb-4">
              {lingoUsers.map((user) => {
                const isSelected = selectedUsers.has(user.userId);
                const alreadyInRoom = isParticipant(user.userId);

                return (
                  <TouchableOpacity
                    key={user.userId}
                    onPress={() => !alreadyInRoom && toggleUserSelection(user.userId)}
                    disabled={alreadyInRoom}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: alreadyInRoom ? 0.5 : 1,
                    }}
                  >
                    {/* Avatar */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary + "20",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      {user.profilePictureUrl ? (
                        <Text>IMG</Text>
                      ) : (
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: colors.primary,
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {user.username}
                      </Text>
                      {user.phoneNumber && (
                        <Text className="text-xs text-muted">{user.phoneNumber}</Text>
                      )}
                      {alreadyInRoom && (
                        <Text className="text-xs text-primary">{t('inviteToRoom.alreadyInRoom')}</Text>
                      )}
                    </View>

                    {/* Checkbox */}
                    {!alreadyInRoom && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : "transparent",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#ffffff" />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Invite Button */}
      {hasPermission && selectedUsers.size > 0 && (
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleInvite}
            disabled={inviting}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {inviting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">
                  {t('inviteToRoom.inviteButton').replace('{count}', selectedUsers.size.toString())}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}
