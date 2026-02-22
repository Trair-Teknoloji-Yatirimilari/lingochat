import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";

interface MessageSearchModalProps {
  visible: boolean;
  roomId: number;
  onClose: () => void;
  onMessageSelect?: (messageId: number) => void;
}

export function MessageSearchModal({
  visible,
  roomId,
  onClose,
  onMessageSelect,
}: MessageSearchModalProps) {
  const colors = useColors();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = trpc.groups.searchMessages.useQuery(
    { roomId, query: searchQuery },
    { enabled: visible && searchQuery.length >= 2 }
  );

  const handleMessagePress = (messageId: number) => {
    onMessageSelect?.(messageId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            marginTop: 60,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
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
              onPress={onClose}
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
              <Text className="text-lg font-bold text-foreground">
                {t("messages.searchMessages")}
              </Text>
            </View>
          </View>

          {/* Search Input */}
          <View style={{ padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("messages.searchPlaceholder")}
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: colors.foreground,
                  fontSize: 16,
                }}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Results */}
          {searchQuery.length < 2 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="search-outline" size={64} color={colors.muted} />
              <Text className="text-sm text-muted mt-4 text-center">
                {t("messages.searchHint")}
              </Text>
            </View>
          ) : isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={searchResults || []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleMessagePress(item.id)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {/* Sender Info */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-semibold text-primary">
                      {item.senderUsername || `User ${item.senderId}`}
                    </Text>
                    <Text className="text-xs text-muted">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Message Text */}
                  <Text className="text-base text-foreground" numberOfLines={3}>
                    {item.originalText}
                  </Text>

                  {/* Translation if available */}
                  {item.translatedText && item.translatedText !== item.originalText && (
                    <Text
                      className="text-sm text-muted mt-2"
                      numberOfLines={2}
                      style={{ fontStyle: "italic" }}
                    >
                      {item.translatedText}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center p-8">
                  <Ionicons name="document-text-outline" size={48} color={colors.muted} />
                  <Text className="text-sm text-muted mt-4">
                    {t("messages.noResults")}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
