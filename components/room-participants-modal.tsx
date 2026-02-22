import { Modal, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface RoomParticipantsModalProps {
  visible: boolean;
  roomId: number;
  onClose: () => void;
  onAddParticipants?: () => void;
  onLeaveRoom?: () => void;
}

export function RoomParticipantsModal({ visible, roomId, onClose, onAddParticipants, onLeaveRoom }: RoomParticipantsModalProps) {
  const colors = useColors();
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: participants, isLoading, refetch } = trpc.groups.getParticipants.useQuery(
    { roomId },
    { enabled: visible && !!roomId }
  );

  // Mutations
  const kickUserMutation = trpc.groups.kickUser.useMutation();
  const banUserMutation = trpc.groups.banUser.useMutation();
  const unbanUserMutation = trpc.groups.unbanUser.useMutation();
  const makeModeratorMutation = trpc.groups.makeModerator.useMutation();
  const removeModeratorMutation = trpc.groups.removeModerator.useMutation();
  const muteUserMutation = trpc.groups.muteUser.useMutation();
  const unmuteUserMutation = trpc.groups.unmuteUser.useMutation();

  // Check if current user is moderator
  const currentUserParticipant = participants?.find(p => p.userId === user?.id);
  const isModerator = currentUserParticipant?.isModerator || false;

  const handleModeratorAction = async (
    action: 'kick' | 'ban' | 'unban' | 'makeModerator' | 'removeModerator' | 'mute' | 'unmute',
    userId: number,
    duration?: number
  ) => {
    try {
      let result;
      let successMessage = '';

      switch (action) {
        case 'kick':
          result = await kickUserMutation.mutateAsync({ roomId, userId });
          successMessage = t('roomDetail.userKicked');
          break;
        case 'ban':
          result = await banUserMutation.mutateAsync({ roomId, userId });
          successMessage = t('roomDetail.userBanned');
          break;
        case 'unban':
          result = await unbanUserMutation.mutateAsync({ roomId, userId });
          successMessage = t('roomDetail.userUnbanned');
          break;
        case 'makeModerator':
          result = await makeModeratorMutation.mutateAsync({ roomId, userId });
          successMessage = t('roomDetail.userMadeModerator');
          break;
        case 'removeModerator':
          result = await removeModeratorMutation.mutateAsync({ roomId, userId });
          successMessage = t('roomDetail.userModeratorRemoved');
          break;
        case 'mute':
          result = await muteUserMutation.mutateAsync({ roomId, userId, duration });
          successMessage = t('roomDetail.userMuted');
          break;
        case 'unmute':
          result = await unmuteUserMutation.mutateAsync({ roomId, userId });
          successMessage = t('roomDetail.userUnmuted');
          break;
      }

      if (result.success) {
        Alert.alert(t('common.success'), successMessage);
        refetch();
      } else {
        Alert.alert(t('common.error'), result.message || t('roomDetail.actionFailed'));
      }
    } catch (error) {
      console.error('Moderator action error:', error);
      Alert.alert(t('common.error'), t('roomDetail.actionFailed'));
    }
  };

  const showModeratorMenu = (userId: number, username: string, isMod: boolean, isMuted: boolean, isBanned: boolean) => {
    const options: any[] = [];

    if (!isBanned) {
      // Kick option
      options.push({
        text: t('roomDetail.kickUser'),
        onPress: () => {
          Alert.alert(
            t('roomDetail.kickUser'),
            t('roomDetail.kickConfirm'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { 
                text: t('roomDetail.kickUser'), 
                style: 'destructive',
                onPress: () => handleModeratorAction('kick', userId)
              }
            ]
          );
        }
      });

      // Ban option
      options.push({
        text: t('roomDetail.banUser'),
        onPress: () => {
          Alert.alert(
            t('roomDetail.banUser'),
            t('roomDetail.banConfirm'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { 
                text: t('roomDetail.banUser'), 
                style: 'destructive',
                onPress: () => handleModeratorAction('ban', userId)
              }
            ]
          );
        }
      });

      // Moderator toggle
      if (isMod) {
        options.push({
          text: t('roomDetail.removeModerator'),
          onPress: () => {
            Alert.alert(
              t('roomDetail.removeModerator'),
              t('roomDetail.removeModeratorConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('roomDetail.removeModerator'),
                  onPress: () => handleModeratorAction('removeModerator', userId)
                }
              ]
            );
          }
        });
      } else {
        options.push({
          text: t('roomDetail.makeModerator'),
          onPress: () => {
            Alert.alert(
              t('roomDetail.makeModerator'),
              t('roomDetail.makeModeratorConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('roomDetail.makeModerator'),
                  onPress: () => handleModeratorAction('makeModerator', userId)
                }
              ]
            );
          }
        });
      }

      // Mute toggle
      if (isMuted) {
        options.push({
          text: t('roomDetail.unmuteUser'),
          onPress: () => handleModeratorAction('unmute', userId)
        });
      } else {
        options.push({
          text: t('roomDetail.muteUser'),
          onPress: () => {
            Alert.alert(
              t('roomDetail.muteUser'),
              t('roomDetail.muteConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('roomDetail.mute10min'),
                  onPress: () => handleModeratorAction('mute', userId, 10)
                },
                { 
                  text: t('roomDetail.mute30min'),
                  onPress: () => handleModeratorAction('mute', userId, 30)
                },
                { 
                  text: t('roomDetail.mute1hour'),
                  onPress: () => handleModeratorAction('mute', userId, 60)
                },
                { 
                  text: t('roomDetail.mutePermanent'),
                  style: 'destructive',
                  onPress: () => handleModeratorAction('mute', userId)
                }
              ]
            );
          }
        });
      }
    } else {
      // Unban option
      options.push({
        text: t('roomDetail.unbanUser'),
        onPress: () => {
          Alert.alert(
            t('roomDetail.unbanUser'),
            t('roomDetail.unbanConfirm'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { 
                text: t('roomDetail.unbanUser'),
                onPress: () => handleModeratorAction('unban', userId)
              }
            ]
          );
        }
      });
    }

    options.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(
      t('roomDetail.moderatorActions'),
      `${username}`,
      options
    );
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

            <View className="flex-row items-center gap-3">
              {/* Add Person Icon */}
              <TouchableOpacity
                onPress={onAddParticipants}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="person-add" size={20} color={colors.primary} />
              </TouchableOpacity>

              {/* Exit Room Icon */}
              <TouchableOpacity
                onPress={onLeaveRoom}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="exit-outline" size={20} color="#ef4444" />
              </TouchableOpacity>

              {/* Close Icon */}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
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
                    <View className="flex-row items-center gap-2 flex-wrap">
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
                      {(item as any).isMuted && (
                        <View
                          style={{
                            backgroundColor: "#f59e0b",
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text className="text-xs font-bold text-white">
                            {t("roomDetail.muted")}
                          </Text>
                        </View>
                      )}
                      {(item as any).isBanned && (
                        <View
                          style={{
                            backgroundColor: "#ef4444",
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text className="text-xs font-bold text-white">
                            {t("roomDetail.banned")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-muted mt-1">
                      {t("groups.joinedAt")}{" "}
                      {new Date(item.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Moderator Menu Button */}
                  {isModerator && item.userId !== user?.id && (
                    <TouchableOpacity
                      onPress={() => showModeratorMenu(
                        item.userId, 
                        item.username || `User ${item.userId}`,
                        item.isModerator,
                        (item as any).isMuted || false,
                        (item as any).isBanned || false
                      )}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 8,
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                  )}

                  {/* Status Indicator (only if not banned/muted) */}
                  {!(item as any).isBanned && !(item as any).isMuted && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#22c55e",
                        marginLeft: 8,
                      }}
                    />
                  )}
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
