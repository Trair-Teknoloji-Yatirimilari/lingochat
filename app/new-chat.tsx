import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useContacts, type Contact } from "@/hooks/use-contacts";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";

export default function NewChatScreen() {
  const router = useRouter();
  const colors = useColors();
  const { contacts, loading, error, hasPermission, requestPermission } =
    useContacts();
  const [searchText, setSearchText] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const createChatMutation = trpc.chat.create.useMutation({
    onSuccess: (chat: any) => {
      router.push(`/chat-detail?chatId=${chat.id}`);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create chat");
    },
  });

  const sendInviteMutation = trpc.chat.sendInvite.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Invitation sent successfully");
      setSelectedContact(null);
      setSearchText("");
    },
    onError: () => {
      Alert.alert("Error", "Failed to send invitation");
    },
  });

  const filteredContacts = useMemo(() => {
    if (!searchText.trim()) return contacts;
    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [contacts, searchText]);

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);

    // Get the phone number or email
    const phoneNumber = contact.phoneNumbers?.[0]?.number;
    const email = contact.emails?.[0]?.email;
    const contactInfo = phoneNumber || email;

    if (!contactInfo) {
      Alert.alert("Error", "Contact has no phone number or email");
      return;
    }

    // Try to create a chat with this contact
    try {
      createChatMutation.mutate({
        participantIdentifier: contactInfo,
      });
    } catch (err) {
      // If chat creation fails, offer to send an invite
      Alert.alert(
        "Send Invitation",
        `${contact.name} is not yet using LingoChat. Send them an invitation?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send Invite",
            onPress: () => {
              sendInviteMutation.mutate({
                contactName: contact.name,
                contactInfo: contactInfo,
              });
            },
          },
        ]
      );
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        "Permission Denied",
        "Please enable contacts permission in settings"
      );
    }
  };

  return (
    <ScreenContainer className="p-4">
      <View className="gap-4 flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">New Chat</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(tabs)/chats" })}
              className="p-2"
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-surface rounded-lg border border-border flex-row items-center px-4 py-3 gap-2">
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Search contacts..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
            className="flex-1 text-foreground"
          />
        </View>

        {/* Permission Request */}
        {!hasPermission && (
          <View className="bg-warning bg-opacity-10 rounded-lg p-4 border border-warning border-opacity-30">
            <Text className="text-sm text-foreground font-medium mb-2">
              Access your contacts to start chatting
            </Text>
            <TouchableOpacity
              onPress={handleRequestPermission}
              className="bg-warning rounded-lg py-2 px-4 items-center"
            >
              <Text className="text-background font-semibold">
                Enable Contacts
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View className="bg-error bg-opacity-10 rounded-lg p-4 border border-error border-opacity-30">
            <Text className="text-sm text-error">{error}</Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Contacts List */}
        {!loading && hasPermission && (
          <>
            {filteredContacts.length === 0 ? (
              <View className="flex-1 items-center justify-center gap-2">
                <Ionicons
                  name="person-outline"
                  size={48}
                  color={colors.muted}
                />
                <Text className="text-muted text-center">
                  {searchText ? "No contacts found" : "No contacts available"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ContactCard
                    contact={item}
                    onPress={() => handleSelectContact(item)}
                    isLoading={
                      createChatMutation.isPending ||
                      sendInviteMutation.isPending
                    }
                  />
                )}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 8 }}
              />
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

function ContactCard({
  contact,
  onPress,
  isLoading,
}: {
  contact: Contact;
  onPress: () => void;
  isLoading: boolean;
}) {
  const colors = useColors();
  const phoneNumber = contact.phoneNumbers?.[0]?.number;
  const email = contact.emails?.[0]?.email;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
    >
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-foreground">
          {contact.name}
        </Text>
        <Text className="text-sm text-muted">
          {phoneNumber || email || "No contact info"}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      )}
    </TouchableOpacity>
  );
}
