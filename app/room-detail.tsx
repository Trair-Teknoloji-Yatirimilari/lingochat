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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { useSocketIO } from "@/hooks/use-socket-io";
import { MediaAttachmentMenu } from "@/components/media-attachment-menu";
import { MediaMessageDisplay } from "@/components/media-message-display";
import { TypingIndicator } from "@/components/typing-indicator";
import { ReactionPicker } from "@/components/reaction-picker";
import { MessageDeleteDialog } from "@/components/message-delete-dialog";
import { Swipeable } from "react-native-gesture-handler";
import type { DocumentPickerAsset } from "expo-document-picker";

interface Message {
  id: number;
  roomId: number;
  senderId: number;
  originalText: string;
  originalLanguage: string;
  translatedText: string | null;
  targetLanguage: string;
  createdAt: Date;
}

export default function RoomDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const { user } = useAuth();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  
  // State management
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<number | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<number, string>>({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  const roomId_num = roomId ? parseInt(roomId, 10) : 0;

  // Socket.IO connection
  const {
    connected,
    connecting,
    sendRoomMessage,
    joinRoom,
    leaveRoom,
    onRoomMessage,
    startTyping,
    stopTyping,
    onTyping,
  } = useSocketIO();

  // tRPC queries
  const roomQuery = trpc.groups.getRoom.useQuery(
    { roomId: roomId_num },
    { enabled: !!roomId_num }
  );

  const messagesQuery = trpc.groups.getMessages.useQuery(
    { roomId: roomId_num, limit: 100 },
    { 
      enabled: !!roomId_num,
      refetchInterval: 1000, // Poll every 1 second for faster updates
    }
  );

  const userProfileQuery = trpc.profile.get.useQuery();
  const leaveRoomMutation = trpc.groups.leaveRoom.useMutation();

  // Initialize messages from query
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data as any);
      // Auto-scroll to bottom when messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messagesQuery.data]);

  // Join room on mount
  useEffect(() => {
    if (roomId_num && connected) {
      joinRoom(roomId_num);
      console.log("[Room] Joined room:", roomId_num);
    }

    return () => {
      if (roomId_num && connected) {
        leaveRoom(roomId_num);
        console.log("[Room] Left room:", roomId_num);
      }
    };
  }, [roomId_num, connected, joinRoom, leaveRoom]);

  // Listen for real-time messages
  useEffect(() => {
    if (!roomId_num) return;

    const unsubscribe = onRoomMessage((newMessage: any) => {
      console.log("[Room] New message received:", newMessage);
      
      setMessages((prev) => {
        console.log("[Room] Adding new message:", newMessage.id);
        return [...prev, newMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return unsubscribe;
  }, [roomId_num, onRoomMessage]);

  // Listen for typing indicators
  useEffect(() => {
    if (!roomId_num) return;

    const unsubscribe = onTyping((userId: number, typing: boolean) => {
      if (userId !== user?.id) {
        setIsTyping(typing);
        if (typing) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    return unsubscribe;
  }, [roomId_num, onTyping, user?.id]);

  // Handle text input change with typing indicator
  const handleTextChange = (text: string) => {
    setMessageText(text);

    if (text.trim() && connected) {
      startTyping(roomId_num);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(roomId_num);
      }, 2000);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !roomId_num || !user || !connected) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: parseInt(tempId.replace("temp-", "")),
      roomId: roomId_num,
      senderId: user.id,
      originalText: messageText.trim(),
      originalLanguage: userProfileQuery.data?.preferredLanguage || "en",
      translatedText: null,
      targetLanguage: userProfileQuery.data?.preferredLanguage || "en",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(roomId_num);

    setSending(true);
    try {
      const messageId = await sendRoomMessage(roomId_num, {
        text: messageText.trim(),
        language: userProfileQuery.data?.preferredLanguage || "en",
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id ? { ...m, id: messageId } : m
        )
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[Room] Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      Alert.alert(t("common.error"), t("messages.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  // Handle message deletion
  const handleDeleteConfirm = async () => {
    if (!selectedMessageId) return;

    try {
      setMessages((prev) => prev.filter((m) => m.id !== selectedMessageId));
      setDeleteDialogVisible(false);
      setSelectedMessageId(null);
    } catch (error) {
      console.error("[Room] Delete message error:", error);
      Alert.alert(t("common.error"), t("messages.deleteFailed"));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false);
    setSelectedMessageId(null);
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
    Alert.alert(
      t("groups.leaveGroup"),
      t("groups.leaveConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("groups.leaveGroup"),
          style: "destructive",
          onPress: async () => {
            try {
              await leaveRoomMutation.mutateAsync({ roomId: roomId_num });
              router.back();
            } catch (error) {
              Alert.alert(t("common.error"), "Failed to leave room");
            }
          },
        },
      ]
    );
  };

  // Handle reactions
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

  // Loading states
  if (roomQuery.isLoading || messagesQuery.isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const room = roomQuery.data;

  if (!room) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Room not found</Text>
      </ScreenContainer>
    );
  }

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

          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {room.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <Ionicons name="key-outline" size={12} color={colors.muted} />
              <Text className="text-xs text-muted">
                {room.roomCode}
              </Text>
              <Text className="text-xs text-muted">•</Text>
              <Ionicons name="people-outline" size={12} color={colors.muted} />
              <Text className="text-xs text-muted">
                {(room as any).participantCount || 0} {t("groups.participants")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {/* TODO: Show participants */}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 50,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="people-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {/* TODO: Search messages */}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 50,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="search-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {/* TODO: AI Analysis */}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 50,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `msg-${item.id}-${index}`}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          renderItem={({ item }) => {
            const isSender = item.senderId === user?.id;

            return (
              <Swipeable
                renderRightActions={
                  !isSender
                    ? undefined
                    : () => (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedMessageId(item.id);
                            setDeleteDialogVisible(true);
                          }}
                          style={{
                            width: 70,
                            height: "100%",
                            backgroundColor: "#ef4444",
                            justifyContent: "center",
                            alignItems: "center",
                            marginLeft: 8,
                          }}
                        >
                          <Ionicons name="trash" size={24} color="#ffffff" />
                        </TouchableOpacity>
                      )
                }
                overshootRight={false}
              >
                <View
                  className={`mb-3 flex-row ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                  style={{
                    marginLeft: isSender ? 60 : 0,
                    marginRight: isSender ? 0 : 60,
                  }}
                >
                  <Pressable
                    onLongPress={() => handleLongPress(item.id)}
                    delayLongPress={500}
                    style={{
                      maxWidth: "95%",
                      borderRadius: 16,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={[colors.surface, colors.surface]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View>
                        {!isSender && (
                          <Text className="text-xs text-muted mb-1 font-semibold">
                            User {item.senderId}
                          </Text>
                        )}
                        {/* Show translated text first (user's language) */}
                        <Text className="text-base text-foreground">
                          {item.translatedText || item.originalText}
                        </Text>

                        {/* Show original text below if different from translation */}
                        {item.translatedText && item.translatedText !== item.originalText && (
                          <View
                            style={{
                              marginTop: 6,
                              paddingTop: 6,
                              borderTopWidth: 1,
                              borderTopColor: colors.border + "60",
                            }}
                          >
                            <Text
                              className="text-sm text-foreground opacity-80"
                              style={{ fontStyle: "italic" }}
                            >
                              {item.originalText}
                            </Text>
                          </View>
                        )}

                        <Text className="text-xs text-muted mt-2">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>

                  {messageReactions[item.id] && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: -4,
                        right: isSender ? 8 : undefined,
                        left: isSender ? undefined : 8,
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderWidth: 2,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>
                        {messageReactions[item.id]}
                      </Text>
                    </View>
                  )}
                </View>
              </Swipeable>
            );
          }}
          inverted={false}
        />

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
              onChangeText={handleTextChange}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
              multiline
              maxLength={500}
              className="flex-1 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending || !connected}
            className={`p-3 rounded-full ${
              messageText.trim() && connected ? "bg-primary" : "bg-border"
            }`}
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
          onImageSelected={() => {}}
          onDocumentSelected={() => {}}
          onLocationSelected={() => {}}
          onContactSelected={() => {}}
        />

        {/* Reaction Picker */}
        <ReactionPicker
          visible={showReactionPicker}
          onClose={() => {
            setShowReactionPicker(false);
            setSelectedMessageForReaction(null);
          }}
          onReactionSelect={handleReactionSelect}
        />

        {/* Delete Dialog */}
        <MessageDeleteDialog
          visible={deleteDialogVisible}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
