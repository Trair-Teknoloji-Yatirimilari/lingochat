import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { ProfilePictureDisplay } from "@/components/profile-picture-display";
import { useProfilePicture } from "@/hooks/use-profile-picture";

const LANGUAGES = [
  { code: "tr", name: "Türkçe" },
  { code: "en", name: "İngilizce" },
  { code: "es", name: "İspanyolca" },
  { code: "fr", name: "Fransızca" },
  { code: "de", name: "Almanca" },
  { code: "ja", name: "Japonca" },
  { code: "zh", name: "Çince" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, logout } = useAuth();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const profileQuery = trpc.profile.get.useQuery();
  const { pickImage, loading: uploadLoading, deleteImage, error } = useProfilePicture();

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setShowLanguageSelector(false);
      Alert.alert("Başarılı", "Dil tercihiniz güncellendi");
    },
    onError: () => {
      Alert.alert("Hata", "Dil tercihi güncellenemedi");
    },
  });

  const handleChangeLanguage = (languageCode: string) => {
    updateProfileMutation.mutate({ preferredLanguage: languageCode });
  };

  const handleUploadProfilePicture = async () => {
    const success = await pickImage();
    if (success) {
      profileQuery.refetch();
    }
  };

  const handleDeleteProfilePicture = async () => {
    Alert.alert(
      "Profil Resmini Sil",
      "Profil resminizi silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
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

  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Çıkış yapmak istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
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

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6 p-6">
          {/* Profile Header */}
          <View className="items-center gap-4 pt-4">
            <ProfilePictureDisplay
              profilePictureUrl={profileQuery.data?.profilePictureUrl}
              username={profileQuery.data?.username}
              onChangePress={handleUploadProfilePicture}
              onDeletePress={handleDeleteProfilePicture}
              loading={uploadLoading}
              size="large"
            />
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground mb-1">
                {profileQuery.data?.username || "Kullanıcı"}
              </Text>
              <Text className="text-sm text-muted">
                {profileQuery.data?.phoneNumber || ""}
              </Text>
            </View>
          </View>

          {/* Language Preference Section */}
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground px-1">
              Dil Tercihi
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
                <View>
                  <Text className="text-xs text-muted mb-1">Mevcut Dil</Text>
                  <Text className="text-base font-semibold text-foreground">
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

          {/* About Section */}
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground px-1">
              Hakkında
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 12,
              }}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Uygulama Sürümü</Text>
                <Text className="text-sm font-semibold text-foreground">1.0.0</Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Kullanıcı ID</Text>
                <Text className="text-sm font-semibold text-foreground">
                  #{user?.id}
                </Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: colors.error || "#EF4444",
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base">Çıkış Yap</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
