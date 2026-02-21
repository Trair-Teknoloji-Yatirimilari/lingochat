import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { ProfilePictureDisplay } from "@/components/profile-picture-display";
import { useProfilePicture } from "@/hooks/use-profile-picture";
import { useI18n } from "@/hooks/use-i18n";
import { LANGUAGES } from "@/lib/i18n";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t, changeLanguage } = useI18n();
  const { user, logout } = useAuth();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const profileQuery = trpc.profile.get.useQuery();
  const { pickImage, loading: uploadLoading, deleteImage, error } = useProfilePicture();

  // Privacy settings from backend
  const showReadReceipts = profileQuery.data?.showReadReceipts ?? true;
  const showOnlineStatus = profileQuery.data?.showOnlineStatus ?? true;
  const showProfilePhoto = profileQuery.data?.showProfilePhoto ?? true;
  const autoDeleteDuration = profileQuery.data?.autoDeleteDuration ?? 86400; // Default: 24 hours

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setShowLanguageSelector(false);
    },
    onError: () => {
      Alert.alert(t('common.error'), t('errors.serverError'));
    },
  });

  const handleChangeLanguage = (languageCode: string) => {
    // Update both app UI language and user profile
    changeLanguage(languageCode);
    updateProfileMutation.mutate({ preferredLanguage: languageCode });
  };

  const handleToggleReadReceipts = () => {
    updateProfileMutation.mutate({ showReadReceipts: !showReadReceipts });
  };

  const handleToggleOnlineStatus = () => {
    updateProfileMutation.mutate({ showOnlineStatus: !showOnlineStatus });
  };

  const handleToggleProfilePhoto = () => {
    updateProfileMutation.mutate({ showProfilePhoto: !showProfilePhoto });
  };

  const handleAutoDeleteChange = (duration: number | null) => {
    // Premium users can't enable auto-delete
    if (profileQuery.data?.isPremium && duration !== null) {
      Alert.alert(
        t('profile.premiumMember'),
        t('profile.premiumNoDelete')
      );
      return;
    }

    updateProfileMutation.mutate({ autoDeleteDuration: duration });
  };

  const handleUploadProfilePicture = async () => {
    const success = await pickImage();
    if (success) {
      profileQuery.refetch();
    }
  };

  const handleDeleteProfilePicture = async () => {
    Alert.alert(
      t('profile.deleteProfilePicture'),
      t('profile.deleteProfilePictureConfirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            const success = await deleteImage();
            if (success) {
              profileQuery.refetch();
            }
          },
        },
      ]
    );
  };

  const deleteAccountMutation = trpc.profile.deleteAccount.useMutation({
    onSuccess: () => {
      Alert.alert(t('profile.accountDeleted'), t('profile.accountDeletedMessage'), [
        {
          text: t('common.done'),
          onPress: () => {
            router.replace("/otp-login");
          },
        },
      ]);
    },
    onError: (error) => {
      Alert.alert(t('common.error'), error.message || t('profile.deleteAccountError'));
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccountTitle'),
      t('profile.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.yes') + ', ' + t('common.delete'),
          style: "destructive",
          onPress: () => {
            // Double confirmation
            Alert.alert(
              t('profile.finalConfirmation'),
              t('profile.finalConfirmationMessage'),
              [
                { text: t('common.cancel'), style: "cancel" },
                {
                  text: t('profile.yesDeleteAccount'),
                  style: "destructive",
                  onPress: () => {
                    deleteAccountMutation.mutate();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('profile.logout'),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/otp-login");
        },
      },
    ]);
  };

  const currentLanguage = profileQuery.data?.preferredLanguage || "tr";
  const currentLanguageName =
    LANGUAGES.find((l) => l.code === currentLanguage)?.name || "Türkçe";

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return "";
    // Format: +90 532 164 67 88
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("90")) {
      return `+90 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
    }
    return phone;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return t('profile.unknown');
    const d = new Date(date);
    return d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:info@trairx.com?subject=LingoChat Destek Talebi");
  };

  const handleRateApp = () => {
    // Apple App Store link
    Alert.alert(t('profile.rateApp'), t('profile.rateAppMessage'));
  };

  const handleShareApp = () => {
    Alert.alert(t('profile.shareApp'), t('profile.shareAppMessage'));
  };

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - White Background */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingTop: 50,
            paddingBottom: 40,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {/* Profile Picture Only */}
          <View className="items-center">
            <ProfilePictureDisplay
              profilePictureUrl={profileQuery.data?.profilePictureUrl}
              username={profileQuery.data?.username}
              onChangePress={handleUploadProfilePicture}
              onDeletePress={handleDeleteProfilePicture}
              loading={uploadLoading}
              size="large"
              showButtons={true}
            />
          </View>
        </View>

        <View className="gap-5 p-5 pt-6">
          {/* Account Info Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.accountInfo')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="text-xs text-muted">{t('profile.username')}</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {profileQuery.data?.username || t('profile.username')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="call" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="text-xs text-muted">{t('profile.phone')}</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {formatPhoneNumber(profileQuery.data?.phoneNumber)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="finger-print" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="text-xs text-muted">{t('profile.userId')}</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      #{user?.id}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Language Preference Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.preferences')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowLanguageSelector(!showLanguageSelector)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="language" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">{t('profile.languagePreference')}</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {currentLanguageName}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showLanguageSelector ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showLanguageSelector && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 8,
                }}
              >
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleChangeLanguage(lang.code)}
                    disabled={updateProfileMutation.isPending}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor:
                        currentLanguage === lang.code
                          ? colors.primary
                          : colors.background,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color:
                          currentLanguage === lang.code
                            ? colors.background
                            : colors.foreground,
                      }}
                    >
                      {lang.name}
                    </Text>
                    {currentLanguage === lang.code && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.background}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Privacy Settings Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.privacySettings')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {/* Read Receipts */}
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="checkmark-done" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{t('profile.readReceipts')}</Text>
                    <Text className="text-xs text-muted">{t('profile.readReceiptsDescription')}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleToggleReadReceipts}
                  disabled={updateProfileMutation.isPending}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: showReadReceipts ? colors.primary : colors.border,
                    justifyContent: "center",
                    padding: 2,
                    opacity: updateProfileMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: "#ffffff",
                      alignSelf: showReadReceipts ? "flex-end" : "flex-start",
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

              {/* Online Status */}
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="radio-button-on" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{t('profile.onlineStatus')}</Text>
                    <Text className="text-xs text-muted">{t('profile.onlineStatusDescription')}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleToggleOnlineStatus}
                  disabled={updateProfileMutation.isPending}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: showOnlineStatus ? colors.primary : colors.border,
                    justifyContent: "center",
                    padding: 2,
                    opacity: updateProfileMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: "#ffffff",
                      alignSelf: showOnlineStatus ? "flex-end" : "flex-start",
                    }}
                  />
                </TouchableOpacity>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

              {/* Profile Photo Visibility */}
              <View className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="image" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{t('profile.profilePhoto')}</Text>
                    <Text className="text-xs text-muted">{t('profile.profilePhotoDescription')}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleToggleProfilePhoto}
                  disabled={updateProfileMutation.isPending}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: showProfilePhoto ? colors.primary : colors.border,
                    justifyContent: "center",
                    padding: 2,
                    opacity: updateProfileMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: "#ffffff",
                      alignSelf: showProfilePhoto ? "flex-end" : "flex-start",
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Auto-Delete Messages Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.autoDeleteMessages')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
              }}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="timer" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{t('profile.messageDeletionTime')}</Text>
                  <Text className="text-xs text-muted">
                    {t('profile.messageDeletionDescription')}
                  </Text>
                </View>
              </View>

              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => handleAutoDeleteChange(21600)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor:
                      autoDeleteDuration === 21600 ? colors.primary + "20" : colors.background,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: autoDeleteDuration === 21600 ? colors.primary : colors.foreground,
                      fontWeight: autoDeleteDuration === 21600 ? "600" : "normal",
                    }}
                  >
                    {t('profile.after6h')}
                  </Text>
                  {autoDeleteDuration === 21600 && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAutoDeleteChange(43200)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor:
                      autoDeleteDuration === 43200 ? colors.primary + "20" : colors.background,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: autoDeleteDuration === 43200 ? colors.primary : colors.foreground,
                      fontWeight: autoDeleteDuration === 43200 ? "600" : "normal",
                    }}
                  >
                    {t('profile.after12h')}
                  </Text>
                  {autoDeleteDuration === 43200 && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAutoDeleteChange(86400)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor:
                      autoDeleteDuration === 86400 ? colors.primary + "20" : colors.background,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: autoDeleteDuration === 86400 ? colors.primary : colors.foreground,
                      fontWeight: autoDeleteDuration === 86400 ? "600" : "normal",
                    }}
                  >
                    {t('profile.after24h')}
                  </Text>
                  {autoDeleteDuration === 86400 && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              {profileQuery.data?.isPremium && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#fbbf24" + "20",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text className="text-xs text-foreground flex-1">
                    {t('profile.premiumInfo')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Support & Help Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.supportHelp')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={handleContactSupport}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="mail" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">
                      {t('profile.contactSupport')}
                    </Text>
                    <Text className="text-xs text-muted">info@trairx.com</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <TouchableOpacity
                onPress={handleRateApp}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="star" size={20} color={colors.primary} />
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    {t('profile.rateApp')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <TouchableOpacity
                onPress={handleShareApp}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="share-social" size={20} color={colors.primary} />
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    {t('profile.shareApp')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.legalPrivacy')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/legal/privacy")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    {t('profile.privacyPolicy')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <TouchableOpacity
                onPress={() => router.push("/legal/terms")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="document-text" size={20} color={colors.primary} />
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    {t('profile.termsOfService')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.accountActions')}
            </Text>
            
            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error || "#EF4444"} />
              <Text style={{ color: colors.error || "#EF4444", fontWeight: "600", fontSize: 15 }}>
                {t('profile.logout')}
              </Text>
            </TouchableOpacity>

            {/* Delete Account Button */}
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                marginBottom: 20,
                opacity: deleteAccountMutation.isPending ? 0.6 : 1,
              }}
            >
              {deleteAccountMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="trash-outline" size={20} color="#ffffff" />
                  <Text className="text-white font-bold text-base">{t('profile.deleteAccount')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
