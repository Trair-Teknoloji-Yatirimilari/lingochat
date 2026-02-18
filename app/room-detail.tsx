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
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useGroupWebSocket } from "@/hooks/use-group-websocket";
import { MediaAttachmentMenu } from "@/components/media-attachment-menu";
import { MediaMessageDisplay } from "@/components/media-message-display";
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
  const scrollViewRef = useRef<ScrollView>(null);

  const roomId = parseInt(params.roomId as string);
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

  // WebSocket connection
  const { connected, messages: wsMessages, sendMessage: wsSendMessage } = useGroupWebSocket(roomId);

  // Fetch room details
  const { data: room, isLoading: roomLoading } = trpc.groups.getRoom.useQuery(
    { roomId },
    { enabled: !!roomId }
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

  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      // Refetch messages to get translations
      refetchMessages();
    }
  }, [wsMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const tempMessage = messageText;
    setMessageText("");
    setSending(true);

    try {
      const result = await sendMessageMutation.mutateAsync({
        roomId,
        text: tempMessage,
      });

      if (result.success) {
        await refetchMessages();
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("Hata", "Mesaj gönderilemedi");
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
      Alert.alert("Hata", "Fotoğraf yüklenemedi");
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
        Alert.alert("Hata", "Medya gönderilemedi");
      }
    } catch (error) {
      console.error("Send media error:", error);
      Alert.alert("Hata", "Medya gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      "Odadan Ayrıl",
      "Bu odadan ayrılmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ayrıl",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveRoomMutation.mutateAsync({ roomId });
              router.back();
            } catch (error) {
              Alert.alert("Hata", "Odadan ayrılırken bir hata oluştu");
            }
          },
        },
      ]
    );
  };

  const handleShowParticipants = () => {
    if (!participants || participants.length === 0) {
      Alert.alert("Katılımcılar", "Henüz katılımcı yok");
      return;
    }

    const participantList = participants
      .map((p: any) => `${p.username}${p.isModerator ? " (Moderatör)" : ""}`)
      .join("\n");

    Alert.alert(
      `Katılımcılar (${participants.length})`,
      participantList,
      [
        { text: "Odadan Ayrıl", style: "destructive", onPress: handleLeaveRoom },
        { text: "Kapat", style: "cancel" },
      ]
    );
  };

  const handleGenerateSummary = async () => {
    if (messages.length < 5) {
      Alert.alert(
        "Yetersiz Mesaj",
        "Özet oluşturmak için en az 5 mesaj gereklidir."
      );
      return;
    }

    Alert.alert(
      "Toplantı Özeti Oluştur",
      "AI ile toplantı özeti oluşturulsun mu? Bu işlem birkaç saniye sürebilir.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Oluştur",
          onPress: async () => {
            setGeneratingSummary(true);
            try {
              const result = await generateSummaryMutation.mutateAsync({
                roomId,
              });

              if (result.success && result.summary) {
                Alert.alert(
                  "Başarılı",
                  "Toplantı özeti oluşturuldu!",
                  [
                    {
                      text: "Görüntüle",
                      onPress: () => {
                        router.push(`/meeting-summary?summaryId=${result.summary.id}` as any);
                      },
                    },
                    { text: "Tamam" },
                  ]
                );
              } else {
                Alert.alert("Hata", result.message || "Özet oluşturulamadı");
              }
            } catch (error) {
              console.error("Generate summary error:", error);
              Alert.alert("Hata", "Özet oluşturulurken bir hata oluştu");
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
          <Text className="text-sm text-muted mt-4">Oda yükleniyor...</Text>
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
            Oda Bulunamadı
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
            <Text className="text-white font-semibold">Geri Dön</Text>
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
                    {participants.length} katılımcı
                  </Text>
                </>
              )}
              {connected && (
                <>
                  <Text className="text-xs text-muted">•</Text>
                  <Text className="text-xs" style={{ color: "#22c55e" }}>
                    Bağlı
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

          <TouchableOpacity
            onPress={() => router.push(`/invite-to-room?roomId=${roomId}` as any)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            <Ionicons name="person-add" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          style={{ flex: 1 }}
        >
          {messagesLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-4">Mesajlar yükleniyor...</Text>
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
                Henüz Mesaj Yok
              </Text>
              <Text className="text-sm text-muted text-center">
                İlk mesajı göndererek konuşmaya başlayın
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {messages.map((message) => {
                const isMyMessage = message.senderId === user?.id;
                const showTranslation =
                  message.originalLanguage !== message.targetLanguage;

                return (
                  <View
                    key={message.id}
                    style={{
                      alignSelf: isMyMessage ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                    }}
                  >
                    {!isMyMessage && (
                      <Text
                        className="text-xs font-semibold mb-1"
                        style={{ color: colors.primary }}
                      >
                        {message.senderUsername || `User ${message.senderId}`}
                      </Text>
                    )}
                    <View
                      style={{
                        backgroundColor: isMyMessage
                          ? colors.primary
                          : colors.surface,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: isMyMessage ? 0 : 1,
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
                              {message.media.mediaUrl && (message.media.mediaType === "image" || message.media.mediaType === "document") && (
                                <TouchableOpacity
                                  onPress={async () => {
                                    if (!message.media?.mediaUrl) return;
                                    if (message.media.mediaType === "image") {
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
                                        const downloadResult = await FileSystem.downloadAsync(message.media.mediaUrl, fileUri);
                                        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                                        Alert.alert("Başarılı", "Fotoğraf galeriye kaydedildi");
                                      } catch (error) {
                                        console.error("Download image error:", error);
                                        Alert.alert("Hata", "Fotoğraf kaydedilemedi");
                                      }
                                    } else if (message.media.mediaType === "document") {
                                      try {
                                        Alert.alert("İndiriliyor", "Belge indiriliyor...");
                                        const FileSystem = await import("expo-file-system/legacy");
                                        const fileName = message.media.fileName || `document_${Date.now()}`;
                                        const fileUri = FileSystem.documentDirectory + fileName;
                                        await FileSystem.downloadAsync(message.media.mediaUrl, fileUri);
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
                                    color={isMyMessage ? "rgba(255, 255, 255, 0.7)" : colors.primary}
                                  />
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text
                              style={{
                                fontSize: 10,
                                color: isMyMessage ? "#ffffff" : colors.muted,
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
                            color: isMyMessage ? "#ffffff" : colors.foreground,
                          }}
                        >
                          {message.translatedText}
                          {"  "}
                          <Text
                            style={{
                              fontSize: 10,
                              color: isMyMessage ? "#ffffff" : colors.muted,
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
                            borderTopColor: isMyMessage
                              ? "rgba(255,255,255,0.2)"
                              : colors.border,
                          }}
                        >
                          <View className="flex-row items-center gap-1 mb-1">
                            <Ionicons
                              name="language"
                              size={12}
                              color={isMyMessage ? "#ffffff" : colors.muted}
                            />
                            <Text
                              style={{
                                fontSize: 10,
                                color: isMyMessage ? "#ffffff" : colors.muted,
                                opacity: 0.7,
                              }}
                            >
                              Orijinal ({message.originalLanguage.toUpperCase()})
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 13,
                              color: isMyMessage ? "#ffffff" : colors.muted,
                              opacity: 0.8,
                              fontStyle: "italic",
                            }}
                          >
                            {message.originalText}
                            {"  "}
                            <Text
                              style={{
                                fontSize: 10,
                                color: isMyMessage ? "#ffffff" : colors.muted,
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
                    </View>
                  </View>
                );
              })}
            </View>
          )}

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
            placeholder="Mesajınızı yazın..."
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
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
