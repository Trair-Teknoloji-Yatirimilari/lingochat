import { useState, useEffect, useRef } from "react";
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
import { MediaAttachmentMenu } from "@/components/media-attachment-menu";
import { MediaMessageDisplay } from "@/components/media-message-display";
import type { DocumentPickerAsset } from "expo-document-picker";

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
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "document" | "location" | "contact";
    data: any;
  } | null>(null);
  const flatListRef = useRef<FlatList>(null);

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
  const generateMediaSummaryMutation = trpc.groups.generateMediaSummary.useMutation();

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

  const handleImageSelected = async (uri: string, type: "camera" | "gallery") => {
    try {
      // Convert image to base64
      const FileSystem = await import("expo-file-system/legacy");
      const base64 = await FileSystem.default.readAsStringAsync(uri, {
        encoding: FileSystem.default.EncodingType.Base64,
      });
      
      // Determine MIME type
      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      setSelectedMedia({ 
        type: "image", 
        data: { 
          uri: dataUri, 
          source: type,
          mimeType,
        } 
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      Alert.alert("Hata", "Fotoğraf yüklenemedi");
    }
  };

  const handleDocumentSelected = (document: DocumentPickerAsset) => {
    setSelectedMedia({ type: "document", data: document });
  };

  const handleLocationSelected = (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    setSelectedMedia({ type: "location", data: location });
  };

  const handleContactSelected = (contact: any) => {
    setSelectedMedia({ type: "contact", data: contact });
  };

  const handleSendMedia = async () => {
    if (!selectedMedia) return;

    setSending(true);
    try {
      const sendMediaMutation = trpc.messages.sendMedia.useMutation();
      const result = await sendMediaMutation.mutateAsync({
        conversationId: conversationId_num,
        mediaType: selectedMedia.type,
        mediaData: selectedMedia.data,
        caption: selectedMedia.type === "image" ? messageText : undefined,
      });

      if (result.success) {
        setSelectedMedia(null);
        setMessageText("");
        await messagesQuery.refetch();
        sendLocalNotification("Başarılı", "Medya gönderildi");
      } else {
        Alert.alert("Hata", "Medya gönderilemedi");
      }
    } catch (error) {
      console.error("Send media error:", error);
      Alert.alert("Hata", "Medya gönderilemedi");
    } finally {
      setSending(false);
    }
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
                  {/* Media Display */}
                  {(item as any).media && (
                    <>
                      <MediaMessageDisplay
                        media={(item as any).media}
                        isMyMessage={isSender}
                      />
                      {/* Time and Download for Media */}
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          {/* AI Summary Button for Image/Document */}
                          {((item as any).media.mediaType === "image" || (item as any).media.mediaType === "document") && (
                            <TouchableOpacity
                              onPress={async () => {
                                try {
                                  const result = await generateMediaSummaryMutation.mutateAsync({
                                    mediaUrl: (item as any).media.mediaUrl,
                                    mediaType: (item as any).media.mediaType,
                                    fileName: (item as any).media.fileName,
                                  });
                                  
                                  if (result.success) {
                                    Alert.alert(
                                      "AI Özeti",
                                      result.summary,
                                      [
                                        { text: "Kapat", style: "cancel" },
                                        {
                                          text: "İndir",
                                          onPress: async () => {
                                            try {
                                              const FileSystem = await import("expo-file-system/legacy");
                                              const fileName = `ozet_${Date.now()}.txt`;
                                              const fileUri = FileSystem.documentDirectory + fileName;
                                              await FileSystem.writeAsStringAsync(fileUri, result.summary || "");
                                              Alert.alert("Başarılı", "Özet indirildi");
                                            } catch (error) {
                                              Alert.alert("Hata", "Özet indirilemedi");
                                            }
                                          },
                                        },
                                      ]
                                    );
                                  } else {
                                    Alert.alert("Hata", result.message || "Özet oluşturulamadı");
                                  }
                                } catch (error) {
                                  console.error("AI summary error:", error);
                                  Alert.alert("Hata", "Özet oluşturulurken hata oluştu");
                                }
                              }}
                            >
                              <Ionicons 
                                name="sparkles" 
                                size={20} 
                                color="#1E3A8A"
                              />
                            </TouchableOpacity>
                          )}
                          {/* Download Button for Image/Document */}
                          {((item as any).media.mediaType === "image" || (item as any).media.mediaType === "document") && (
                            <TouchableOpacity
                              onPress={async () => {
                                if ((item as any).media.mediaType === "image") {
                                  try {
                                    const MediaLibrary = await import("expo-media-library");
                                    const { status } = await MediaLibrary.requestPermissionsAsync();
                                    if (status !== "granted") {
                                      Alert.alert("İzin Gerekli", "Galeriye kaydetmek için izin gereklidir");
                                      return;
                                    }
                                    Alert.alert("İndiriliyor", "Fotoğraf galeriye kaydediliyor...");
                                    const FileSystem = await import("expo-file-system/legacy");
                                    const fileUri = FileSystem.documentDirectory + `image_${Date.now()}.jpg`;
                                    const downloadResult = await FileSystem.downloadAsync((item as any).media.mediaUrl, fileUri);
                                    await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                                    Alert.alert("Başarılı", "Fotoğraf galeriye kaydedildi");
                                  } catch (error) {
                                    console.error("Download image error:", error);
                                    Alert.alert("Hata", "Fotoğraf kaydedilemedi");
                                  }
                                } else if ((item as any).media.mediaType === "document") {
                                  try {
                                    Alert.alert("İndiriliyor", "Belge indiriliyor...");
                                    const FileSystem = await import("expo-file-system/legacy");
                                    const fileName = (item as any).media.fileName || `document_${Date.now()}`;
                                    const fileUri = FileSystem.documentDirectory + fileName;
                                    await FileSystem.downloadAsync((item as any).media.mediaUrl, fileUri);
                                    Alert.alert("Başarılı", "Belge indirildi");
                                  } catch (error) {
                                    console.error("Download error:", error);
                                    Alert.alert("Hata", "Belge indirilemedi");
                                  }
                                }
                              }}
                            >
                              <Ionicons 
                                name="arrow-down-circle" 
                                size={20} 
                                color={isSender ? "rgba(255, 255, 255, 0.7)" : colors.primary}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text
                            className={`text-xs ${
                              isSender
                                ? "text-background opacity-70"
                                : "text-muted"
                            }`}
                          >
                            {new Date(item.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                          {isSender && (
                            <Text className={`text-xs ${isRead ? "text-green-400" : "text-background opacity-70"}`}>
                              {isRead ? "✓✓" : "✓"}
                            </Text>
                          )}
                        </View>
                      </View>
                    </>
                  )}

                  {/* Text Message */}
                  {!(item as any).media && (
                    <Text
                      className={`text-base ${
                        isSender ? "text-background" : "text-foreground"
                      }`}
                    >
                      {item.originalText}
                      {"  "}
                      <Text
                        className={`text-xs ${
                          isSender
                            ? "text-background opacity-70"
                            : "text-muted"
                        }`}
                      >
                        {new Date(item.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                      {isSender && (
                        <Text className={`text-xs ${isRead ? "text-green-400" : "text-background opacity-70"}`}>
                          {" "}{isRead ? "✓✓" : "✓"}
                        </Text>
                      )}
                    </Text>
                  )}
                  
                  {!(item as any).media && item.isTranslated && item.translatedText && (
                    <View className="mt-2 pt-2 border-t border-opacity-30 border-current">
                      <Text
                        className={`text-sm italic ${
                          isSender
                            ? "text-background opacity-80"
                            : "text-muted"
                        }`}
                      >
                        {item.translatedText}
                        {"  "}
                        <Text
                          className={`text-xs ${
                            isSender
                              ? "text-background opacity-70"
                              : "text-muted"
                          }`}
                        >
                          {new Date(item.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                        {isSender && (
                          <Text className={`text-xs ${isRead ? "text-green-400" : "text-background opacity-70"}`}>
                            {" "}{isRead ? "✓✓" : "✓"}
                          </Text>
                        )}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          }}
          inverted
        />

        {/* Selected Media Preview - Compact */}
        {selectedMedia && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              marginBottom: 8,
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                {selectedMedia.type === "image" && (
                  <Image
                    source={{ uri: selectedMedia.data.uri }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                    }}
                    resizeMode="cover"
                  />
                )}
                {selectedMedia.type === "document" && (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="document-text" size={20} color={colors.primary} />
                  </View>
                )}
                {selectedMedia.type === "location" && (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="location" size={20} color={colors.primary} />
                  </View>
                )}
                {selectedMedia.type === "contact" && (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                )}
                <View className="flex-1">
                  {selectedMedia.type === "document" && (
                    <>
                      <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                        {selectedMedia.data.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        {(selectedMedia.data.size / 1024).toFixed(2)} KB
                      </Text>
                    </>
                  )}
                  {selectedMedia.type === "contact" && (
                    <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                      {selectedMedia.data.name}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedMedia(null)}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Input */}
        <View className="flex-row gap-2 items-end">
          <TouchableOpacity
            onPress={() => setShowMediaMenu(true)}
            className="p-3 rounded-full bg-surface border border-border"
          >
            <Ionicons name="add" size={20} color={colors.primary} />
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
            onPress={() => {
              if (selectedMedia) {
                handleSendMedia();
              } else {
                handleSendMessage();
              }
            }}
            disabled={(!messageText.trim() && !selectedMedia) || loading}
            className={`p-3 rounded-full ${
              (messageText.trim() || selectedMedia) ? "bg-primary" : "bg-border"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Media Attachment Menu */}
        <MediaAttachmentMenu
          visible={showMediaMenu}
          onClose={() => setShowMediaMenu(false)}
          onImageSelected={handleImageSelected}
          onDocumentSelected={handleDocumentSelected}
          onLocationSelected={handleLocationSelected}
          onContactSelected={handleContactSelected}
        />

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
