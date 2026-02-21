import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useGroupWebSocket } from "@/hooks/use-group-websocket";
import { useI18n } from "@/hooks/use-i18n";
import { MediaAttachmentMenu } from "@/components/media-attachment-menu";
import { MediaMessageDisplay } from "@/components/media-message-display";
import { TypingIndicator } from "@/components/typing-indicator";
import { ReactionPicker } from "@/components/reaction-picker";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import type { DocumentPickerAsset } from "expo-document-picker";

interface Message {
  id: number;
  roomId: number;
  senderId: number;
  originalText: string;
  originalLanguage: string;
  translatedText: string;
  targetLanguage: string;
  createdAt: Date;
  isDeleted: boolean;
  senderUsername?: string;
  senderProfilePicture?: string;
  media?: {
    id: number;
    mediaType: string;
    mediaUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    latitude?: string | null;
    longitude?: string | null;
    address?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    caption?: string | null;
  } | null;
}

export default function RoomDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);

  // Safe roomId parsing with validation
  const roomIdParam = params.roomId;
  const roomId = roomIdParam ? parseInt(roomIdParam as string, 10) : 0;

  // Early return if invalid roomId
  if (!roomId || isNaN(roomId)) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error || "#EF4444"} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600", marginTop: 16 }}>
            {t('roomDetail.notFound')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            Invalid room ID. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>
              {t('roomDetail.goBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "document" | "location" | "contact";
    data: any;
  } | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<number | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<number, string>>({});
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  // WebSocket connection
  const { connected, messages: wsMessages, sendMessage: wsSendMessage } = useGroupWebSocket(roomId);

  // Fetch room details
  const { data: room, isLoading: roomLoading } = trpc.groups.getRoom.useQuery(
    { roomId },
    { enabled: !!roomId && roomId > 0 }
  );

  // Fetch messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = trpc.groups.getMessages.useQuery(
    { roomId, limit: 100 },
    { enabled: !!roomId }
  );

  // Fetch participants
  const { data: participants } = trpc.groups.getParticipants.useQuery(
    { roomId },
    { enabled: !!roomId }
  );

  const sendMessageMutation = trpc.groups.sendMessage.useMutation();
  const sendMediaMutation = trpc.groups.sendMediaMessage.useMutation();
  const leaveRoomMutation = trpc.groups.leaveRoom.useMutation();
  const generateSummaryMutation = trpc.groups.generateSummary.useMutation();
  const generateMediaSummaryMutation = trpc.groups.generateMediaSummary.useMutation();

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData as any);
      // Scroll to bottom when messages load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messagesData]);

  // Filter messages based on search query
  const filteredMessages = messages.filter((message) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const translatedText = message.translatedText?.toLowerCase() || "";
    const originalText = message.originalText?.toLowerCase() || "";
    const senderUsername = message.senderUsername?.toLowerCase() || "";
    
    return translatedText.includes(query) || 
           originalText.includes(query) || 
           senderUsername.includes(query);
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      // Refetch messages to get translations
      refetchMessages();
    }
  }, [wsMessages]);

  // Simulate typing indicator
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldShow = Math.random() > 0.8;
      setIsTyping(shouldShow);
      
      if (shouldShow) {
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLongPress = (messageId: number) => {
    setSelectedMessageForReaction(messageId);
    setShowReactionPicker(true);
  };

  const handleReactionSelect = (emoji: string) => {
    if (selectedMessageForReaction) {
      setMessageReactions((prev) => ({
        ...prev,
        [selectedMessageForReaction]: emoji,
      }));
      setSelectedMessageForReaction(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const tempMessage = messageText;
    setMessageText("");
    setReplyToMessage(null); // Clear reply
    setSending(true);

    try {
      const result = await sendMessageMutation.mutateAsync({
        roomId,
        text: tempMessage,
        replyToMessageId: replyToMessage?.id,
      });

      if (result.success) {
        await refetchMessages();
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert(t('common.error'), t('messages.sendFailed'));
      setMessageText(tempMessage);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing after 2 seconds of inactivity
    }, 2000);
  };

  const handleImageSelected = async (uri: string, type: "camera" | "gallery") => {
    try {
      // Convert image to base64
      const FileSystem = await import("expo-file-system/legacy");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
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
      
      // Scroll to bottom to show preview
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error converting image to base64:", error);
      Alert.alert(t('common.error'), t('messages.photoUploadFailed'));
    }
  };

  const handleDocumentSelected = (document: DocumentPickerAsset) => {
    setSelectedMedia({ type: "document", data: document });
    
    // Scroll to bottom to show preview
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLocationSelected = (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    setSelectedMedia({ type: "location", data: location });
    
    // Scroll to bottom to show preview
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleContactSelected = (contact: any) => {
    setSelectedMedia({ type: "contact", data: contact });
    
    // Scroll to bottom to show preview
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMedia = async () => {
    if (!selectedMedia) return;

    setSending(true);
    try {
      const result = await sendMediaMutation.mutateAsync({
        roomId,
        mediaType: selectedMedia.type,
        mediaData: selectedMedia.data,
        caption: selectedMedia.type === "image" ? messageText : undefined,
      });

      if (result.success) {
        setSelectedMedia(null);
        setMessageText("");
        await refetchMessages();
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        Alert.alert(t('common.error'), t('messages.mediaSendFailed'));
      }
    } catch (error) {
      console.error("Send media error:", error);
      Alert.alert(t('common.error'), t('messages.mediaSendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      t('roomDetail.leaveRoom'),
      t('roomDetail.leaveRoomConfirm'),
      [
        { text: t('roomDetail.cancel'), style: "cancel" },
        {
          text: t('roomDetail.leave'),
          style: "destructive",
          onPress: async () => {
            try {
              await leaveRoomMutation.mutateAsync({ roomId });
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), t('roomDetail.leaveError'));
            }
          },
        },
      ]
    );
  };

  const handleShowParticipants = () => {
    setShowParticipantsModal(true);
  };

  const handleGenerateSummary = async () => {
    if (messages.length < 5) {
      Alert.alert(
        t('roomDetail.insufficientMessages'),
        t('roomDetail.insufficientMessagesDescription')
      );
      return;
    }

    Alert.alert(
      t('roomDetail.generateSummary'),
      t('roomDetail.generateSummaryConfirm'),
      [
        { text: t('roomDetail.cancel'), style: "cancel" },
        {
          text: t('roomDetail.generate'),
          onPress: async () => {
            setGeneratingSummary(true);
            try {
              const result = await generateSummaryMutation.mutateAsync({
                roomId,
              });

              if (result.success && result.summary) {
                Alert.alert(
                  t('roomDetail.summarySuccess'),
                  t('roomDetail.summarySuccessDescription'),
                  [
                    {
                      text: t('roomDetail.view'),
                      onPress: () => {
                        router.push(`/meeting-summary?summaryId=${result.summary.id}` as any);
                      },
                    },
                    { text: t('roomDetail.ok') },
                  ]
                );
              } else {
                Alert.alert(t('common.error'), result.message || t('roomDetail.summaryError'));
              }
            } catch (error) {
              console.error("Generate summary error:", error);
              Alert.alert(t('common.error'), t('roomDetail.summaryErrorDescription'));
            } finally {
              setGeneratingSummary(false);
            }
          },
        },
      ]
    );
  };

  if (roomLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted mt-4">{t('roomDetail.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!room) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle" size={64} color={colors.muted} />
          <Text className="text-lg font-bold text-foreground mt-4">
            {t('roomDetail.notFound')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginTop: 16,
            }}
          >
            <Text className="text-white font-semibold">{t('roomDetail.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
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
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                {room.name}
              </Text>
              {connected && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#22c55e",
                  }}
                />
              )}
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="key" size={12} color={colors.muted} />
              <Text className="text-xs text-muted font-mono">{room.roomCode}</Text>
              {participants && (
                <>
                  <Text className="text-xs text-muted">•</Text>
                  <Text className="text-xs text-muted">
                    {participants.length} {t('roomDetail.participants')}
                  </Text>
                </>
              )}
              {connected && (
                <>
                  <Text className="text-xs text-muted">•</Text>
                  <Text className="text-xs" style={{ color: "#22c55e" }}>
                    {t('roomDetail.connected')}
                  </Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShowParticipants}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 4,
            }}
          >
            <Ionicons name="people" size={20} color={colors.foreground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: showSearch ? colors.primary + "20" : colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            <Ionicons 
              name={showSearch ? "close" : "search"} 
              size={20} 
              color={showSearch ? colors.primary : colors.foreground} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGenerateSummary}
            disabled={generatingSummary}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: generatingSummary
                ? colors.border
                : colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            {generatingSummary ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="sparkles" size={20} color="#1E3A8A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View
            style={{
              padding: 12,
              paddingTop: 8,
              backgroundColor: colors.background,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput
                placeholder={t('roomDetail.searchPlaceholder')}
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.foreground,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery && (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
                {filteredMessages.length} {t('roomDetail.resultsFound')}
              </Text>
            )}
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          style={{ flex: 1 }}
        >
          {messagesLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-4">{t('roomDetail.loadingMessages')}</Text>
            </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
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
                <Ionicons name="chatbubbles" size={40} color={colors.primary} />
              </View>
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('roomDetail.noMessages')}
              </Text>
              <Text className="text-sm text-muted text-center">
                {t('roomDetail.noMessagesDescription')}
              </Text>
            </View>
          ) : filteredMessages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.muted + "15",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="search-outline" size={40} color={colors.muted} />
              </View>
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('roomDetail.noResults')}
              </Text>
              <Text className="text-sm text-muted text-center">
                "{searchQuery}" {t('roomDetail.noResultsFor')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredMessages.map((message, index) => {
                // Robust comparison: ensure both values are numbers and handle edge cases
                const messageSenderId = message.senderId ? Number(message.senderId) : null;
                const currentUserId = user?.id ? Number(user.id) : null;
                const isMyMessage = messageSenderId !== null && 
                                   currentUserId !== null && 
                                   messageSenderId === currentUserId;
                
                const showTranslation =
                  message.originalLanguage !== message.targetLanguage;

                const renderRightActions = () => (
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      width: 60,
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="arrow-undo" size={24} color={colors.primary} />
                  </View>
                );

                const renderLeftActions = () => (
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      width: 60,
                      marginLeft: 8,
                    }}
                  >
                    <Ionicons name="arrow-undo" size={24} color={colors.primary} />
                  </View>
                );

                return (
                  <Swipeable
                    key={message.id}
                    renderRightActions={isMyMessage ? undefined : renderRightActions}
                    renderLeftActions={isMyMessage ? renderLeftActions : undefined}
                    onSwipeableOpen={() => {
                      setReplyToMessage(message);
                    }}
                    overshootRight={false}
                    overshootLeft={false}
                  >
                  <View
                    style={{
                      alignSelf: isMyMessage ? "flex-end" : "flex-start",
                      maxWidth: "95%",
                      marginBottom: messageReactions[message.id] ? 28 : 12,
                      marginLeft: isMyMessage ? 60 : 0,
                      marginRight: isMyMessage ? 0 : 60,
                    }}
                  >
                    <View style={{ position: "relative", paddingBottom: messageReactions[message.id] ? 16 : 0 }}>
                    {!isMyMessage && (
                      <Text
                        className="text-xs font-semibold mb-1"
                        style={{ color: colors.primary }}
                      >
                        {message.senderUsername || `User ${message.senderId}`}
                      </Text>
                    )}
                    <Pressable
                      onLongPress={() => handleLongPress(message.id)}
                      delayLongPress={500}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                    <LinearGradient
                      colors={[colors.surface, colors.surface]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Media Display */}
                      {message.media && (
                        <>
                          <MediaMessageDisplay
                            media={message.media}
                            isMyMessage={isMyMessage}
                          />
                          {/* Time and Download for Media */}
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              {/* AI Summary Button for Image/Document */}
                              {message.media.mediaUrl && (message.media.mediaType === "image" || message.media.mediaType === "document") && (
                                <TouchableOpacity
                                  onPress={async () => {
                                    try {
                                      const result = await generateMediaSummaryMutation.mutateAsync({
                                        mediaUrl: message.media!.mediaUrl!,
                                        mediaType: message.media!.mediaType as "image" | "document",
                                        fileName: message.media!.fileName || undefined,
                                      });
                                      
                                      if (result.success) {
                                        Alert.alert(
                                          t('roomDetail.aiSummary'),
                                          result.summary,
                                          [
                                            { text: t('roomDetail.close'), style: "cancel" },
                                            {
                                              text: t('roomDetail.download'),
                                              onPress: async () => {
                                                try {
                                                  const FileSystem = await import("expo-file-system/legacy");
                                                  const fileName = `ozet_${Date.now()}.txt`;
                                                  const fileUri = FileSystem.documentDirectory + fileName;
                                                  await FileSystem.writeAsStringAsync(fileUri, result.summary || "");
                                                  Alert.alert(t('common.success'), t('roomDetail.summaryDownloaded'));
                                                } catch (error) {
                                                  Alert.alert(t('common.error'), t('roomDetail.summaryDownloadError'));
                                                }
                                              },
                                            },
                                          ]
                                        );
                                      } else {
                                        Alert.alert(t('common.error'), result.message || t('roomDetail.summaryError'));
                                      }
                                    } catch (error) {
                                      console.error("AI summary error:", error);
                                      Alert.alert(t('common.error'), t('roomDetail.summaryGenerateError'));
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
                              {message.media.mediaUrl && (message.media.mediaType === "image" || message.media.mediaType === "document") && (
                                <TouchableOpacity
                                  onPress={async () => {
                                    if (!message.media?.mediaUrl) return;
                                    if (message.media.mediaType === "image") {
                                      try {
                                        const MediaLibrary = await import("expo-media-library");
                                        const { status } = await MediaLibrary.requestPermissionsAsync();
                                        if (status !== "granted") {
                                          Alert.alert(t('roomDetail.permissionRequired'), t('roomDetail.galleryPermission'));
                                          return;
                                        }
                                        Alert.alert(t('roomDetail.downloading'), t('roomDetail.downloadingPhoto'));
                                        const FileSystem = await import("expo-file-system/legacy");
                                        const fileUri = FileSystem.documentDirectory + `image_${Date.now()}.jpg`;
                                        const downloadResult = await FileSystem.downloadAsync(message.media.mediaUrl, fileUri);
                                        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                                        Alert.alert(t('common.success'), t('roomDetail.photoSaved'));
                                      } catch (error) {
                                        console.error("Download image error:", error);
                                        Alert.alert(t('common.error'), t('roomDetail.photoSaveError'));
                                      }
                                    } else if (message.media.mediaType === "document") {
                                      try {
                                        Alert.alert(t('roomDetail.downloading'), t('roomDetail.downloadingDocument'));
                                        const FileSystem = await import("expo-file-system/legacy");
                                        const fileName = message.media.fileName || `document_${Date.now()}`;
                                        const fileUri = FileSystem.documentDirectory + fileName;
                                        await FileSystem.downloadAsync(message.media.mediaUrl, fileUri);
                                        Alert.alert(t('common.success'), t('roomDetail.documentDownloaded'));
                                      } catch (error) {
                                        console.error("Download error:", error);
                                        Alert.alert(t('common.error'), t('roomDetail.documentDownloadError'));
                                      }
                                    }
                                  }}
                                >
                                  <Ionicons 
                                    name="arrow-down-circle" 
                                    size={20} 
                                    color={colors.primary}
                                  />
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text
                              style={{
                                fontSize: 10,
                                color: colors.muted,
                                opacity: 0.6,
                              }}
                            >
                              {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                        </>
                      )}

                      {/* Text Message */}
                      {!message.media && (
                        <Text
                          style={{
                            fontSize: 15,
                            color: colors.foreground,
                          }}
                        >
                          {message.translatedText}
                          {"  "}
                          <Text
                            style={{
                              fontSize: 10,
                              color: colors.muted,
                              opacity: 0.6,
                            }}
                          >
                            {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </Text>
                      )}
                      
                      {showTranslation && (
                        <View
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                          }}
                        >
                          <View className="flex-row items-center gap-1 mb-1">
                            <Ionicons
                              name="language"
                              size={12}
                              color={colors.muted}
                            />
                            <Text
                              style={{
                                fontSize: 10,
                                color: colors.muted,
                                opacity: 0.7,
                              }}
                            >
                              {t('roomDetail.original')} ({message.originalLanguage.toUpperCase()})
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.muted,
                              opacity: 0.8,
                              fontStyle: "italic",
                            }}
                          >
                            {message.originalText}
                            {"  "}
                            <Text
                              style={{
                                fontSize: 10,
                                color: colors.muted,
                                opacity: 0.6,
                              }}
                            >
                              {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                    </Pressable>
                    
                    {/* Reaction Badge */}
                    {messageReactions[message.id] && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: isMyMessage ? 8 : undefined,
                          left: isMyMessage ? undefined : 8,
                          backgroundColor: colors.background,
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderWidth: 2,
                          borderColor: colors.border,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 4,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{messageReactions[message.id]}</Text>
                      </View>
                    )}
                    </View>
                  </View>
                  </Swipeable>
                );
              })}
            </View>
          )}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}

          {/* Selected Media Preview - Compact */}
          {selectedMedia && (
            <View
              style={{
                marginHorizontal: 0,
                marginTop: 12,
                marginBottom: 0,
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
        </ScrollView>

        {/* Reply Preview */}
        {replyToMessage && (
          <View
            style={{
              marginHorizontal: 12,
              marginBottom: 8,
              backgroundColor: colors.surface,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              borderRadius: 8,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginBottom: 4 }}>
                {Number(replyToMessage.senderId) === Number(user?.id) ? t('roomDetail.you') : replyToMessage.senderUsername || `User ${replyToMessage.senderId}`}
              </Text>
              <Text
                style={{ fontSize: 14, color: colors.foreground }}
                numberOfLines={2}
              >
                {replyToMessage.translatedText || replyToMessage.originalText || t('roomDetail.media')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyToMessage(null)}>
              <Ionicons name="close-circle" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            gap: 8,
          }}
        >
          {/* Attachment Button */}
          <TouchableOpacity
            onPress={() => setShowMediaMenu(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              handleTyping();
            }}
            placeholder={t('roomDetail.typeMessage')}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.foreground,
              maxHeight: 100,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <TouchableOpacity
            onPress={() => {
              if (selectedMedia) {
                handleSendMedia();
              } else {
                handleSendMessage();
              }
            }}
            disabled={(!messageText.trim() && !selectedMedia) || sending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                (messageText.trim() || selectedMedia) && !sending ? colors.primary : colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" size="small" />
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

        {/* Participants Modal */}
        <Modal
          visible={showParticipantsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowParticipantsModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setShowParticipantsModal(false)}
            />
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: "80%",
                paddingBottom: Platform.OS === "ios" ? 34 : 16,
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
                    {t('roomDetail.participantsTitle')}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
                    {participants?.length || 0} {t('roomDetail.people')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowParticipantsModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Participants List */}
              <ScrollView
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              >
                {!participants || participants.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: colors.muted + "15",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons name="people-outline" size={32} color={colors.muted} />
                    </View>
                    <Text style={{ fontSize: 14, color: colors.muted }}>
                      {t('roomDetail.noParticipants')}
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {participants.map((participant: any) => (
                      <View
                        key={participant.userId}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 12,
                          padding: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        {/* Profile Picture */}
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: colors.primary + "20",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {participant.profilePicture ? (
                            <Image
                              source={{ uri: participant.profilePicture }}
                              style={{ width: 44, height: 44, borderRadius: 22 }}
                            />
                          ) : (
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: "bold",
                                color: colors.primary,
                              }}
                            >
                              {participant.username?.charAt(0).toUpperCase() || "?"}
                            </Text>
                          )}
                        </View>

                        {/* User Info */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: colors.foreground,
                              }}
                              numberOfLines={1}
                            >
                              {participant.username}
                            </Text>
                            {participant.isModerator && (
                              <View
                                style={{
                                  backgroundColor: colors.primary + "20",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: "700",
                                    color: colors.primary,
                                  }}
                                >
                                  MOD
                                </Text>
                              </View>
                            )}
                            {Number(participant.userId) === Number(user?.id) && (
                              <View
                                style={{
                                  backgroundColor: colors.muted + "20",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: "700",
                                    color: colors.muted,
                                  }}
                                >
                                  SİZ
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.muted,
                              marginTop: 2,
                            }}
                          >
                            {participant.preferredLanguage?.toUpperCase() || "TR"}
                          </Text>
                        </View>

                        {/* Online Status */}
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: "#22c55e",
                          }}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={{ padding: 16, paddingTop: 12, gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowParticipantsModal(false);
                    router.push(`/invite-to-room?roomId=${roomId}` as any);
                  }}
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
                  <Ionicons name="person-add" size={20} color="#ffffff" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
                    {t('roomDetail.addPerson')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowParticipantsModal(false);
                    Alert.alert(
                      t('roomDetail.leaveRoom'),
                      t('roomDetail.leaveRoomConfirm'),
                      [
                        { text: t('roomDetail.cancel'), style: "cancel" },
                        {
                          text: t('roomDetail.leave'),
                          style: "destructive",
                          onPress: handleLeaveRoom,
                        },
                      ]
                    );
                  }}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: "#ef4444",
                  }}
                >
                  <Ionicons name="exit-outline" size={20} color="#ef4444" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#ef4444" }}>
                    {t('roomDetail.exitRoom')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Reaction Picker */}
        <ReactionPicker
          visible={showReactionPicker}
          onClose={() => {
            setShowReactionPicker(false);
            setSelectedMessageForReaction(null);
          }}
          onReactionSelect={handleReactionSelect}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
