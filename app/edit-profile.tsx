import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
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

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const { user } = useAuth();
  
  const profileQuery = trpc.profile.get.useQuery();
  const { pickImage, loading: uploadLoading, deleteImage } = useProfilePicture();
  
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("tr");

  useEffect(() => {
    if (profileQuery.data) {
      setUsername(profileQuery.data.username || "");
      setSelectedLanguage(profileQuery.data.preferredLanguage || "tr");
    }
  }, [profileQuery.data]);

  const checkUsernameMutation = trpc.profile.checkUsername.useQuery(
    { username },
    { enabled: false }
  );

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      Alert.alert(t('common.success'), t('profile.profileUpdated'), [
        { text: t('common.done'), onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert(t('common.error'), error.message || t('errors.serverError'));
    },
  });

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    setUsernameError("");

    // Validate username format
    if (text.length < 3) {
      setUsernameError(t('profile.usernameMinLength'));
      return;
    }

    if (text.length > 20) {
      setUsernameError(t('profile.usernameMaxLength'));
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      setUsernameError(t('profile.usernameInvalidChars'));
      return;
    }

    // Skip check if username hasn't changed
    if (text === profileQuery.data?.username) {
      return;
    }

    // Check availability
    setCheckingUsername(true);
    try {
      const result = await trpc.profile.checkUsername.query({ username: text });
      if (!result.available) {
        setUsernameError(t('profile.usernameTaken'));
      }
    } catch (error) {
      console.error("Username check error:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSave = () => {
    if (usernameError) {
      Alert.alert(t('common.error'), usernameError);
      return;
    }

    if (username.length < 3) {
      Alert.alert(t('common.error'), t('profile.usernameMinLength'));
      return;
    }

    updateProfileMutation.mutate({
      username,
      preferredLanguage: selectedLanguage,
    });
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

  const isLoading = profileQuery.isLoading || updateProfileMutation.isPending;
  const hasChanges = 
    username !== profileQuery.data?.username ||
    selectedLanguage !== profileQuery.data?.preferredLanguage;

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingTop: 50,
            paddingBottom: 30,
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
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground">
              {t('profile.editProfile')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Profile Picture */}
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
          {/* Username Section */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.username')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: usernameError ? colors.error || "#EF4444" : colors.border,
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
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <TextInput
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder={t('profile.enterUsername')}
                    placeholderTextColor={colors.muted}
                    style={{
                      fontSize: 16,
                      color: colors.foreground,
                      padding: 0,
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                  />
                </View>
                {checkingUsername && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
                {!checkingUsername && username && !usernameError && username !== profileQuery.data?.username && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </View>
              {usernameError && (
                <Text className="text-xs mt-2" style={{ color: colors.error || "#EF4444" }}>
                  {usernameError}
                </Text>
              )}
              <Text className="text-xs text-muted mt-2">
                {t('profile.usernameHelp')}
              </Text>
            </View>
          </View>

          {/* Phone Number (Read-only) */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.phone')}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                opacity: 0.6,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.muted + "20",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="call" size={20} color={colors.muted} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted">
                    {profileQuery.data?.phoneNumber || t('profile.phone')}
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={20} color={colors.muted} />
              </View>
              <Text className="text-xs text-muted mt-2">
                {t('profile.phoneNotEditable')}
              </Text>
            </View>
          </View>

          {/* Language Preference */}
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground px-1">
              {t('profile.languagePreference')}
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
              {LANGUAGES.map((lang, index) => (
                <View key={lang.code}>
                  {index > 0 && (
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                  )}
                  <TouchableOpacity
                    onPress={() => setSelectedLanguage(lang.code)}
                    style={{
                      padding: 16,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor:
                        selectedLanguage === lang.code
                          ? colors.primary + "10"
                          : "transparent",
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
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: selectedLanguage === lang.code ? "600" : "normal",
                          color: colors.foreground,
                        }}
                      >
                        {lang.name}
                      </Text>
                    </View>
                    {selectedLanguage === lang.code && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !hasChanges || !!usernameError || checkingUsername}
            style={{
              backgroundColor: 
                isLoading || !hasChanges || !!usernameError || checkingUsername
                  ? colors.muted
                  : colors.primary,
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              marginTop: 10,
              marginBottom: 20,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">
                  {t('common.save')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
