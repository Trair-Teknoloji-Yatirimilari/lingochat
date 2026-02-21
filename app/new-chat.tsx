import { useState, useEffect } from "react";
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
import { useI18n } from "@/hooks/use-i18n";
import { Ionicons } from "@expo/vector-icons";

export default function NewChatScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const trpcUtils = trpc.useUtils();

  const createChatMutation = trpc.chat.create.useMutation({
    onSuccess: (chat: any) => {
      router.push(`/chat-detail?conversationId=${chat.id}`);
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message || t('chats.createFailed'));
    },
  });

  // Load contacts automatically when screen opens
  useEffect(() => {
    if (!hasLoadedOnce) {
      loadContacts();
    }
  }, []);

  // Load contacts from phone
  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('messages.permissionRequired'), t('newChat.contactPermission'));
        setLoadingContacts(false);
        setHasLoadedOnce(true);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        // Format contacts and check which ones are LingoChat users
        const formattedContacts = data
          .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map(contact => ({
            id: contact.id,
            name: contact.name || 'Unknown',
            phoneNumber: contact.phoneNumbers![0].number?.replace(/[^\d+]/g, ''),
          }))
          .filter(contact => contact.phoneNumber); // Remove contacts without valid phone numbers
        
        // Check which contacts are LingoChat users
        const phoneNumbers = formattedContacts.map(c => c.phoneNumber);
        const lingoChatUsers = await trpcUtils.client.chat.checkContactsOnPlatform.query({
          phoneNumbers,
        });
        
        // Merge contact info with LingoChat user info
        const contactsWithUserInfo = formattedContacts.map(contact => {
          const userInfo = lingoChatUsers.find((u: any) => u.phoneNumber === contact.phoneNumber);
          return {
            ...contact,
            isLingoUser: !!userInfo,
            userId: userInfo?.userId,
            username: userInfo?.username,
            profilePictureUrl: userInfo?.profilePictureUrl,
          };
        });
        
        // Sort: LingoChat users first
        contactsWithUserInfo.sort((a, b) => {
          if (a.isLingoUser && !b.isLingoUser) return -1;
          if (!a.isLingoUser && b.isLingoUser) return 1;
          return 0;
        });
        
        setContacts(contactsWithUserInfo);
      }
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Load contacts error:', error);
      Alert.alert(t('common.error'), t('newChat.loadContactsFailed'));
      setHasLoadedOnce(true);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = async (contact: any) => {
    if (!contact.isLingoUser) {
      Alert.alert(
        t('newChat.notOnLingoChat'),
        t('newChat.inviteContact', { name: contact.name })
      );
      return;
    }
    
    try {
      createChatMutation.mutate({
        participantIdentifier: contact.phoneNumber,
      });
    } catch (error) {
      console.error("Create chat from contact error:", error);
      Alert.alert(t('common.error'), t('chats.createFailed'));
    }
  };

  return (
    <ScreenContainer className="p-4">
      <View className="gap-4 flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">{t('chats.newChat')}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        {loadingContacts ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-base text-muted">{t('newChat.loadingContacts')}</Text>
          </View>
        ) : contacts.length > 0 ? (
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-foreground">
                {t('newChat.phoneContacts')}
              </Text>
              <TouchableOpacity
                onPress={loadContacts}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="refresh" size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                  {t('newChat.refresh')}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ContactCard
                  contact={item}
                  onPress={() => handleSelectContact(item)}
                  isLoading={createChatMutation.isPending}
                />
              )}
              contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
            />
          </View>
        ) : hasLoadedOnce ? (
          /* No Contacts State */
          <View className="flex-1 items-center justify-center gap-3">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.muted + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="people-outline" size={40} color={colors.muted} />
            </View>
            <Text className="text-base text-muted text-center px-8">
              {t('newChat.noContactsFound')}
            </Text>
            <TouchableOpacity
              onPress={loadContacts}
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: colors.primary + "20",
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {t('newChat.refresh')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Empty State - Loading for first time */
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
              <Ionicons name="people" size={40} color={colors.primary} />
            </View>
            <Text className="text-base text-muted text-center px-8">
              {t('newChat.emptyState')}
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

// Contact Card Component
function ContactCard({
  contact,
  onPress,
  isLoading,
}: {
  contact: any;
  onPress: () => void;
  isLoading: boolean;
}) {
  const colors = useColors();
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading || !contact.isLingoUser}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: contact.isLingoUser ? 1 : 0.6,
      }}
    >
      <View className="flex-row items-center gap-3">
        {contact.profilePictureUrl ? (
          <Image
            source={{ uri: contact.profilePictureUrl }}
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
              backgroundColor: contact.isLingoUser ? colors.primary + "20" : colors.muted + "20",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons 
              name="person" 
              size={24} 
              color={contact.isLingoUser ? colors.primary : colors.muted} 
            />
          </View>
        )}
        
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-foreground">
              {contact.name}
            </Text>
            {contact.isLingoUser && (
              <View
                style={{
                  backgroundColor: colors.primary + "20",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
                  LingoChat
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-muted">
            {contact.username ? `@${contact.username}` : contact.phoneNumber}
          </Text>
          {!contact.isLingoUser && (
            <Text className="text-xs text-muted mt-1">
              {t('newChat.notOnPlatform')}
            </Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : contact.isLingoUser ? (
          <Ionicons name="chatbubble" size={20} color={colors.primary} />
        ) : (
          <Ionicons name="mail" size={20} color={colors.muted} />
        )}
      </View>
    </TouchableOpacity>
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
