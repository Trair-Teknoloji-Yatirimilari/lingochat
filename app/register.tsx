import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      router.replace("/(tabs)");
    },
    onError: (error) => {
      Alert.alert("Hata", error.message || "Profil güncellenemedi");
    },
  });

  const uploadProfilePictureMutation = trpc.profile.uploadProfilePicture.useMutation();

  // Username validation
  const validateUsername = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    return cleaned;
  };

  // Profile image picker
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için galeri erişim izni gereklidir");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  // Username debounce and check
  useEffect(() => {
    if (username.length === 0) {
      setUsernameStatus("idle");
      setSuggestedUsernames([]);
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setUsernameStatus("idle");
      setSuggestedUsernames([]);
      return;
    }

    // Debounce: 500ms bekle
    const timer = setTimeout(() => {
      setUsernameStatus("checking");
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Check username availability with backend
  const checkUsernameMutation = trpc.profile.checkUsername.useQuery(
    { username },
    { 
      enabled: usernameStatus === "checking" && username.length >= 3 && username.length <= 20,
      refetchOnWindowFocus: false,
    }
  );

  // Update status based on backend response
  useEffect(() => {
    if (usernameStatus !== "checking") return;
    
    if (checkUsernameMutation.isLoading) {
      // Keep checking status
      return;
    }
    
    if (checkUsernameMutation.data) {
      if (checkUsernameMutation.data.available) {
        setUsernameStatus("available");
        setSuggestedUsernames([]);
      } else {
        setUsernameStatus("taken");
        setSuggestedUsernames(checkUsernameMutation.data.suggestions || []);
      }
    } else if (checkUsernameMutation.error) {
      // Backend hatası - varsayılan olarak müsait kabul et
      console.error("Username check error:", checkUsernameMutation.error);
      setUsernameStatus("available");
      setSuggestedUsernames([]);
    }
  }, [usernameStatus, checkUsernameMutation.isLoading, checkUsernameMutation.data, checkUsernameMutation.error]);

  const handleRegister = async () => {
    if (!firstName.trim()) {
      Alert.alert("Hata", "Lütfen adınızı girin");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Hata", "Lütfen soyadınızı girin");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert("Hata", "Kullanıcı adı 3-20 karakter arasında olmalıdır");
      return;
    }

    if (usernameStatus !== "available") {
      Alert.alert("Hata", "Lütfen müsait bir kullanıcı adı seçin");
      return;
    }

    setLoading(true);
    try {
      console.log("[Register] Updating profile:", { username, preferredLanguage: "tr" });
      
      // Önce profili güncelle
      await updateProfileMutation.mutateAsync({
        username,
        preferredLanguage: "tr",
      });
      
      console.log("[Register] Profile updated successfully");
      
      // Eğer profil resmi seçildiyse yükle
      if (profileImage) {
        console.log("[Register] Uploading profile picture...");
        try {
          // Read file as base64
          const fileContent = await FileSystem.readAsStringAsync(profileImage, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Determine MIME type
          const mimeType = profileImage.endsWith(".png") ? "image/png" : "image/jpeg";

          // Upload to server
          await uploadProfilePictureMutation.mutateAsync({
            fileContent,
            mimeType,
          });
          
          console.log("[Register] Profile picture uploaded successfully");
        } catch (uploadError) {
          console.error("[Register] Profile picture upload error:", uploadError);
          // Profil resmi yüklenemese bile devam et
        }
      }
      
      // Başarılı, ana sayfaya yönlendir
      router.replace("/(tabs)");
    } catch (error) {
      console.error("[Register] Profile update error:", error);
      Alert.alert("Hata", "Profil güncellenemedi. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  const getUsernameColor = () => {
    switch (usernameStatus) {
      case "available":
        return colors.success || "#4CAF50";
      case "taken":
        return colors.error || "#EF4444";
      case "checking":
        return colors.muted;
      default:
        return colors.border;
    }
  };

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case "available":
        return "checkmark-circle";
      case "taken":
        return "close-circle";
      case "checking":
        return "time";
      default:
        return "person";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12 pb-6">
            {/* Header */}
            <View className="items-center mb-8">
              {/* Profile Picture */}
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                  borderWidth: 3,
                  borderColor: colors.primary,
                  overflow: "hidden",
                }}
              >
                {profileImage ? (
                  <>
                    <Image
                      source={{ uri: profileImage }}
                      style={{ width: "100%", height: "100%", borderRadius: 50 }}
                    />
                    <TouchableOpacity
                      onPress={removeImage}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: colors.error || "#EF4444",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color={colors.primary} />
                    <Text className="text-xs mt-1" style={{ color: colors.primary }}>
                      Fotoğraf Ekle
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text className="text-3xl font-bold text-foreground mb-2">
                Profil Oluştur
              </Text>
              <Text className="text-center text-muted text-sm">
                Hesabınızı tamamlamak için bilgilerinizi girin
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4 flex-1">
              {/* First Name */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Ad <Text className="text-error">*</Text>
                </Text>
                <View 
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Ionicons name="person-outline" size={20} color={colors.muted} />
                  <TextInput
                    placeholder="Adınız"
                    value={firstName}
                    onChangeText={setFirstName}
                    className="flex-1 ml-3 text-foreground text-base"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Last Name */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Soyad <Text className="text-error">*</Text>
                </Text>
                <View 
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Ionicons name="person-outline" size={20} color={colors.muted} />
                  <TextInput
                    placeholder="Soyadınız"
                    value={lastName}
                    onChangeText={setLastName}
                    className="flex-1 ml-3 text-foreground text-base"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Username */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Kullanıcı Adı <Text className="text-error">*</Text>
                </Text>
                <View 
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: getUsernameColor(),
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text className="text-muted text-base">@</Text>
                  <TextInput
                    placeholder="kullaniciadi"
                    value={username}
                    onChangeText={(text) => setUsername(validateUsername(text))}
                    className="flex-1 ml-2 text-foreground text-base"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    editable={!loading}
                  />
                  {usernameStatus === "checking" && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                  {(usernameStatus === "available" || usernameStatus === "taken") && (
                    <Ionicons 
                      name={getUsernameIcon()} 
                      size={24} 
                      color={getUsernameColor()} 
                    />
                  )}
                </View>

                {/* Username Info */}
                <View className="mt-2">
                  {username.length > 0 && username.length < 3 && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="information-circle" size={14} color={colors.muted} />
                      <Text className="text-xs text-muted">
                        En az 3 karakter gerekli
                      </Text>
                    </View>
                  )}
                  {username.length > 20 && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="alert-circle" size={14} color={colors.error || "#EF4444"} />
                      <Text className="text-xs" style={{ color: colors.error || "#EF4444" }}>
                        En fazla 20 karakter olabilir
                      </Text>
                    </View>
                  )}
                  {usernameStatus === "checking" && (
                    <View className="flex-row items-center gap-1">
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text className="text-xs text-muted">
                        Kontrol ediliyor...
                      </Text>
                    </View>
                  )}
                  {usernameStatus === "available" && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={14} color={colors.success || "#22C55E"} />
                      <Text className="text-xs" style={{ color: colors.success || "#22C55E" }}>
                        Kullanıcı adı müsait
                      </Text>
                    </View>
                  )}
                  {usernameStatus === "taken" && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="close-circle" size={14} color={colors.error || "#EF4444"} />
                      <Text className="text-xs" style={{ color: colors.error || "#EF4444" }}>
                        Bu kullanıcı adı alınmış
                      </Text>
                    </View>
                  )}
                </View>

                {/* Username Suggestions */}
                {suggestedUsernames.length > 0 && (
                  <View className="mt-3">
                    <Text className="text-xs font-semibold text-foreground mb-2">
                      Önerilen kullanıcı adları:
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {suggestedUsernames.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setUsername(suggestion)}
                          style={{
                            backgroundColor: colors.primary + "15",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.primary + "30",
                          }}
                        >
                          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                            @{suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Phone Number Display */}
              {phoneNumber && (
                <View 
                  style={{
                    backgroundColor: colors.primary + "10",
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="call" size={16} color={colors.primary} />
                  <Text className="text-xs text-foreground">
                    Telefon: <Text className="font-semibold">{phoneNumber}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={
                loading ||
                !firstName.trim() ||
                !lastName.trim() ||
                usernameStatus !== "available"
              }
              style={{
                backgroundColor:
                  loading ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  usernameStatus !== "available"
                    ? colors.border
                    : colors.primary,
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background font-bold text-base">
                  Hesabı Oluştur
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
