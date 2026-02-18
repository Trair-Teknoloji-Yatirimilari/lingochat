import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useNotifications } from "@/hooks/use-notifications";
import { useMessageDelete } from "@/hooks/use-message-delete";
import { MessageDeleteDialog } from "@/components/message-delete-dialog";
import { useWebSocket } from "@/hooks/use-websocket";

export default function ChatDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendLocalNotification } = useNotifications();
  const { deleteMessage, loading: deleteLoading } = useMessageDelete();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);

  const conversationId_num = conversationId ? parseInt(conversationId, 10) : 0;

  const messagesQuery = trpc.messages.list.useQuery(
    { conversationId: conversationId_num, limit: 50 },
    { enabled: !!conversationId_num }
  );

  const conversationQuery = trpc.conversations.get.useQuery(
    { id: conversationId_num },
    { enabled: !!conversationId_num }
  );

  const userProfileQuery = trpc.profile.get.useQuery();

  // Get read receipts for messages
  const readReceiptsQuery = trpc.readReceipts.getForConversation.useQuery(
    { conversationId: conversationId_num },
    { enabled: !!conversationId_num }
  );

  // Mark messages as read when viewing conversation
  const markAsReadMutation = trpc.readReceipts.markAsRead.useMutation();

  // WebSocket connection
  const { sendMessageDeleted, onMessageDeleted } = useWebSocket(conversationId_num);

  // Listen for message deletions from other users
  useEffect(() => {
    onMessageDeleted((msg: any) => {
      console.log("Message deleted via WebSocket:", msg);
      messagesQuery.refetch();
    });
  }, [onMessageDeleted, messagesQuery]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      messages.forEach((msg) => {
        if (msg.senderId !== user.id) {
          markAsReadMutation.mutate({
            messageId: msg.id,
            conversationId: conversationId_num,
          });
        }
      });
    }
  }, [messages.length, user?.id, conversationId_num]);

  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      setMessageText("");
      sendLocalNotification("Message Sent", "Your message was delivered");
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to send message");
      console.error(error);
    },
  });

  const handleLongPress = (messageId: number, senderId: number) => {
    // Sadece kendi mesajlarını silebilir
    if (senderId === user?.id) {
      setSelectedMessageId(messageId);
      setDeleteDialogVisible(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMessageId) return;

    const success = await deleteMessage(selectedMessageId);
    if (success) {
      setDeleteDialogVisible(false);
      setSelectedMessageId(null);
      messagesQuery.refetch();
      sendLocalNotification("Mesaj Silindi", "Mesajınız başarıyla silindi");
      
      // WebSocket ile diğer kullanıcılara bildir
      sendMessageDeleted(selectedMessageId);
    } else {
      Alert.alert("Hata", "Mesaj silinemedi");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false);
    setSelectedMessageId(null);
  };

  // Simulate receiving message notification
  useEffect(() => {
    const timer = setInterval(() => {
      // This would normally come from WebSocket
      // For now, just a placeholder
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId_num || !user) return;

    const conversation = conversationQuery.data;
    if (!conversation) return;

    const recipientId =
      conversation.participant1Id === user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    const senderLanguage = userProfileQuery.data?.preferredLanguage || "tr";
    const recipientLanguage = "en"; // Placeholder - should come from recipient profile

    setLoading(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversationId_num,
        text: messageText.trim(),
        recipientLanguage,
      });
      // Send notification to recipient
      sendLocalNotification(
        "New Message",
        `${user.email}: ${messageText.trim().substring(0, 50)}...`
      );
    } finally {
      setLoading(false);
    }
  };

  if (messagesQuery.isLoading || conversationQuery.isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const allMessages = messagesQuery.data || [];
  // Silinen mesajları filtrele (sadece kendi sildiğin mesajları gizle)
  const messages = allMessages.filter(
    (msg) => !(msg.deletedBy === user?.id && msg.deletedAt)
  );
  const conversation = conversationQuery.data;

  if (!conversation) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Conversation not found</Text>
      </ScreenContainer>
    );
  }

  const recipientId =
    conversation.participant1Id === user?.id
      ? conversation.participant2Id
      : conversation.participant1Id;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="p-4 gap-4" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>

          {/* Profile Picture */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <Text className="text-xl">👤</Text>
          </View>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              User {recipientId}
            </Text>
            <Text className="text-xs text-muted">Conversation #{conversationId}</Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isSender = item.senderId === user?.id;
            const messageReadReceipts = readReceiptsQuery.data?.filter(
              (r) => r.messageId === item.id
            ) || [];
            const isRead = messageReadReceipts.length > 0;

            return (
              <View
                className={`mb-3 flex-row ${
                  isSender ? "justify-end" : "justify-start"
                }`}
              >
                <Pressable
                  onLongPress={() => handleLongPress(item.id, item.senderId)}
                  delayLongPress={500}
                  className={`max-w-xs rounded-2xl p-3 ${
                    isSender
                      ? "bg-primary rounded-br-none"
                      : "bg-surface border border-border rounded-bl-none"
                  }`}
                >
                  <Text
                    className={`text-base ${
                      isSender ? "text-background" : "text-foreground"
                    }`}
                  >
                    {item.originalText}
                  </Text>
                  {item.isTranslated && item.translatedText && (
                    <View className="mt-2 pt-2 border-t border-opacity-30 border-current">
                      <Text
                        className={`text-sm italic ${
                          isSender
                            ? "text-background opacity-80"
                            : "text-muted"
                        }`}
                      >
                        {item.translatedText}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-end gap-1 mt-1">
                    <Text
                      className={`text-xs ${
                        isSender
                          ? "text-background opacity-70"
                          : "text-muted"
                      }`}
                    >
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                    {/* Read receipt indicator */}
                    {isSender && (
                      <Text className={`text-xs ${isRead ? "text-green-400" : "text-background opacity-70"}`}>
                        {isRead ? "✓✓" : "✓"}
                      </Text>
                    )}
                  </View>
                </Pressable>
              </View>
            );
          }}
          inverted
        />

        {/* Message Input */}
        <View className="flex-row gap-2 items-end">
          <TouchableOpacity
            onPress={() => router.push(`/media-picker?conversationId=${conversationId}`)}
            className="p-3 rounded-full bg-primary"
          >
            <Ionicons name="image" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center border border-border rounded-full px-4 py-2 bg-surface">
            <TextInput
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              className="flex-1 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={loading || !messageText.trim()}
            className={`p-3 rounded-full ${
              messageText.trim() ? "bg-primary" : "bg-border"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Delete Dialog */}
        <MessageDeleteDialog
          visible={deleteDialogVisible}
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
