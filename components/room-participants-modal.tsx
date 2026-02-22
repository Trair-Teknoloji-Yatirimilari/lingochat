import { Modal, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";

interface RoomParticipantsModalProps {
  visible: boolean;
  roomId: number;
  onClose: () => void;
}

export function RoomParticipantsModal({ visible, roomId, onClose }: RoomParticipantsModalProps) {
  const colors = useColors();
  const { t } = useI18n();

  const { data: participants, isLoading } = trpc.groups.getParticipants.useQuery(
    { roomId },
    { enabled: visible && !!roomId }
  );

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
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "80%",
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text className="text-lg font-bold text-foreground">
                {t("groups.participants")}
              </Text>
              {participants && (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text className="text-xs font-bold text-white">
                    {participants.length}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Participants List */}
          {isLoading ? (
            <View className="items-center justify-center p-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={participants || []}
              keyExtractor={(item) => item.userId.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
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
                    {item.profilePictureUrl ? (
                      <Text className="text-lg">👤</Text>
                    ) : (
                      <Text className="text-lg font-bold text-primary">
                        {item.username?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    )}
                  </View>

                  {/* User Info */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">
                        {item.username || `User ${item.userId}`}
                      </Text>
                      {item.isModerator && (
                        <View
                          style={{
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text className="text-xs font-bold text-white">
                            {t("groups.moderator")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-muted mt-1">
                      {t("groups.joinedAt")}{" "}
                      {new Date(item.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Status Indicator */}
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#22c55e",
                    }}
                  />
                </View>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center p-8">
                  <Ionicons name="people-outline" size={48} color={colors.muted} />
                  <Text className="text-sm text-muted mt-4">
                    {t("groups.noParticipants")}
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
