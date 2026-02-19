import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { isValidPhoneNumber } from "libphonenumber-js";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";

type LoginStep = "phone" | "otp";

const COUNTRY_CODES: Record<string, { name: string; code: string; flag: string }> = {
  TR: { name: "Turkey", code: "+90", flag: "🇹🇷" },
  US: { name: "United States", code: "+1", flag: "🇺🇸" },
  GB: { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  DE: { name: "Germany", code: "+49", flag: "🇩🇪" },
  FR: { name: "France", code: "+33", flag: "🇫🇷" },
  ES: { name: "Spain", code: "+34", flag: "🇪🇸" },
  IT: { name: "Italy", code: "+39", flag: "🇮🇹" },
  JP: { name: "Japan", code: "+81", flag: "🇯🇵" },
  CN: { name: "China", code: "+86", flag: "🇨🇳" },
  IN: { name: "India", code: "+91", flag: "🇮🇳" },
  BR: { name: "Brazil", code: "+55", flag: "🇧🇷" },
  MX: { name: "Mexico", code: "+52", flag: "🇲🇽" },
  AU: { name: "Australia", code: "+61", flag: "🇦🇺" },
  CA: { name: "Canada", code: "+1", flag: "🇨🇦" },
  RU: { name: "Russia", code: "+7", flag: "🇷🇺" },
  KR: { name: "South Korea", code: "+82", flag: "🇰🇷" },
  SG: { name: "Singapore", code: "+65", flag: "🇸🇬" },
  AE: { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  SA: { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  NG: { name: "Nigeria", code: "+234", flag: "🇳🇬" },
};

export default function OtpLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState<LoginStep>("phone");
  const [selectedCountry, setSelectedCountry] = useState("TR");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // OTP input refs
  const otpInputs = useRef<Array<TextInput | null>>([]);

  const countryCode = COUNTRY_CODES[selectedCountry]?.code || "+90";
  const fullPhoneNumber = `${countryCode}${phoneNumber}`;

  // TRPC mutations
  const sendOtpMutation = trpc.auth.sendOtp.useMutation();
  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation();

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Sadece rakam kabul et
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Sadece son karakteri al
    setOtp(newOtp);

    // Otomatik olarak sonraki input'a geç
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    // Backspace ile önceki input'a geç
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Hata", "Lütfen telefon numarasını girin");
      return;
    }

    if (!isValidPhoneNumber(fullPhoneNumber)) {
      Alert.alert("Hata", "Geçersiz telefon numarası");
      return;
    }

    setLoading(true);
    try {
      // Backend'e OTP gönderme isteği
      const result = await sendOtpMutation.mutateAsync({
        phoneNumber: fullPhoneNumber,
      });

      if (result.success) {
        setStep("otp");
        setResendTimer(60);
        
        // Development modunda OTP'yi göster
        if (result.otp) {
          Alert.alert("Test Modu", `OTP Kodu: ${result.otp}\n\n${fullPhoneNumber} numarasına gönderildi`);
        } else {
          Alert.alert("Başarılı", `${fullPhoneNumber} numarasına OTP gönderildi`);
        }
      } else {
        Alert.alert("Hata", result.message || "OTP gönderilemedi");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("[OTP] Send error:", error);
      Alert.alert("Hata", "OTP gönderilemedi. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      Alert.alert("Hata", "Lütfen 6 haneli OTP'yi girin");
      return;
    }

    setLoading(true);
    try {
      // Backend'e OTP doğrulama isteği gönder
      const result = await verifyOtpMutation.mutateAsync({
        phoneNumber: fullPhoneNumber,
        code: otpCode,
      });

      if (result.success) {
        // Session token'ı sakla
        if (result.sessionToken) {
          await Auth.setSessionToken(result.sessionToken);
          console.log("[OTP] Session token saved");
        }

        // User bilgisini cache'e kaydet
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod,
            lastSignedIn: new Date(result.user.lastSignedIn),
          });
          console.log("[OTP] User info saved to cache:", result.user.id);
        }

        console.log("[OTP] Verify result:", {
          hasCompletedProfile: result.hasCompletedProfile,
          userId: result.userId,
        });

        // Profil durumuna göre yönlendir
        if (result.hasCompletedProfile) {
          // Kullanıcı daha önce profil oluşturmuş, direkt ana sayfaya git
          console.log("[OTP] User has completed profile, redirecting to home");
          router.replace("/(tabs)");
        } else {
          // Kullanıcı profil oluşturmamış, kayıt sayfasına git
          console.log("[OTP] User needs to complete profile, redirecting to register");
          router.replace({
            pathname: "/register",
            params: { phoneNumber: fullPhoneNumber },
          });
        }
      } else {
        Alert.alert("Hata", result.message || "Geçersiz OTP kodu");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("[OTP] Verification error:", error);
      Alert.alert("Hata", "OTP doğrulanamadı. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="justify-between pb-6">
        {step === "phone" ? (
          <>
            {/* Header with Icon */}
            <View className="items-center pt-12 pb-8">
              {/* App Icon */}
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 24,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Ionicons name="chatbubbles" size={60} color={colors.primary} />
              </View>
              
              <Text className="text-5xl font-bold mb-2" style={{ color: colors.primary }}>
                LingoChat
              </Text>
              <Text className="text-center text-muted text-base leading-relaxed px-4">
                Dil bariyerlerini kaldırın, dünyayla bağlantı kurun
              </Text>
            </View>

            {/* Phone Input Section */}
            <View className="gap-6 flex-1 justify-center px-4">
              <View>
                <Text className="text-base font-semibold text-foreground mb-4">
                  Telefon numaranızı girin
                </Text>

                {/* Phone Number Input - Ülke Kodu ve Numara Yan Yana */}
                <View className="flex-row gap-2 mb-3">
                  {/* Country Selector - Kompakt */}
                  <TouchableOpacity
                    onPress={() => setShowCountryPicker(!showCountryPicker)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor: colors.surface,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 100,
                    }}
                  >
                    <Text className="text-2xl">{COUNTRY_CODES[selectedCountry]?.flag}</Text>
                    <Text className="text-primary font-semibold text-sm">{countryCode}</Text>
                    <Ionicons
                      name={showCountryPicker ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  {/* Phone Number Input - Geniş */}
                  <View 
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <TextInput
                      placeholder="555 123 4567"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={15}
                      className="flex-1 text-foreground text-base font-semibold"
                      placeholderTextColor={colors.muted}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Privacy Notice - Telefon Numarasının Hemen Altında */}
                <Text className="text-xs text-muted text-center leading-relaxed px-2 mb-4">
                  Devam ederek{" "}
                  <Text className="font-semibold" style={{ color: colors.primary }}>
                    Gizlilik Politikası
                  </Text>
                  {" "}ve{" "}
                  <Text className="font-semibold" style={{ color: colors.primary }}>
                    Kullanım Şartları
                  </Text>
                  'nı kabul etmiş olursunuz.
                </Text>
              </View>

              {/* Company Info */}
              <View 
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="business" size={16} color={colors.primary} />
                  <Text className="text-xs font-semibold" style={{ color: colors.foreground }}>
                    TrairX Technology O.Ü
                  </Text>
                </View>
                <Text className="text-xs text-muted text-center">
                  LingoChat, TrairX Technology O.Ü şirketinin ürünüdür
                </Text>
              </View>

              {/* Info Text */}
              <Text className="text-xs text-muted text-center px-4 leading-relaxed">
                Uluslararası ücretler uygulanabilir. Mesaj ve veri ücretleri de geçerlidir.
              </Text>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading || !phoneNumber.trim()}
              className={`mx-4 p-4 rounded-lg items-center justify-center ${
                loading || !phoneNumber.trim() ? "bg-border" : "bg-primary"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background font-bold text-base">Devam Et</Text>
              )}
            </TouchableOpacity>

            {/* Country Picker Modal */}
            <Modal
              visible={showCountryPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowCountryPicker(false)}
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
                  onPress={() => setShowCountryPicker(false)}
                />
                <View 
                  style={{
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: "70%",
                    paddingTop: 20,
                  }}
                >
                  {/* Modal Header */}
                  <View className="px-6 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
                        Ülke Seçin
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowCountryPicker(false)}
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
                  </View>

                  {/* Country List */}
                  <ScrollView>
                    {Object.entries(COUNTRY_CODES).map(([code, { name, flag }]) => (
                      <TouchableOpacity
                        key={code}
                        onPress={() => {
                          setSelectedCountry(code);
                          setShowCountryPicker(false);
                        }}
                        className="px-6 py-4 border-b flex-row items-center gap-3"
                        style={{ borderBottomColor: colors.border }}
                      >
                        <Text className="text-3xl">{flag}</Text>
                        <View className="flex-1">
                          <Text className="text-foreground font-semibold text-base">{name}</Text>
                          <Text className="text-primary font-semibold text-sm">
                            {COUNTRY_CODES[code]?.code}
                          </Text>
                        </View>
                        {selectedCountry === code && (
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <>
            {/* OTP Verification Header */}
            <View className="items-center pt-12 pb-8 px-6">
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setResendTimer(0);
                }}
                style={{
                  position: "absolute",
                  left: 20,
                  top: 48,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>

              {/* Icon */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary + "20",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons name="mail-open" size={40} color={colors.primary} />
              </View>

              {/* Title */}
              <Text 
                className="text-3xl font-bold text-center mb-3" 
                style={{ color: colors.foreground }}
              >
                Kodu Doğrulayın
              </Text>

              {/* Description */}
              <Text className="text-center text-muted text-base leading-relaxed px-4">
                {fullPhoneNumber} numarasına gönderilen 6 haneli doğrulama kodunu girin
              </Text>
            </View>

            {/* OTP Input Section */}
            <View className="gap-6 flex-1 justify-center px-4">
              {/* OTP Input Boxes - 6 Ayrı Kutu */}
              <View className="flex-row justify-center gap-3">
                {otp.map((digit, index) => (
                  <View
                    key={index}
                    style={{
                      width: 50,
                      height: 60,
                      borderWidth: 2,
                      borderColor: digit ? colors.primary : colors.border,
                      borderRadius: 12,
                      backgroundColor: colors.surface,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      ref={(ref) => (otpInputs.current[index] = ref)}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        width: "100%",
                        height: "100%",
                        textAlign: "center",
                        fontSize: 24,
                        fontWeight: "bold",
                        color: colors.foreground,
                      }}
                      editable={!loading}
                      autoFocus={index === 0}
                    />
                  </View>
                ))}
              </View>

              {/* Resend Section */}
              <View className="items-center gap-2">
                {resendTimer > 0 ? (
                  <Text className="text-sm text-muted">
                    Kodu tekrar gönder ({resendTimer}s)
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setOtp(["", "", "", "", "", ""]);
                      handleSendOtp();
                    }}
                    disabled={loading}
                    className="py-2"
                  >
                    <Text className="text-sm font-semibold text-primary">
                      Kodu tekrar gönder
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={loading || otp.join("").length !== 6}
              className={`mx-4 p-4 rounded-lg items-center justify-center ${
                loading || otp.join("").length !== 6 ? "bg-border" : "bg-primary"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background font-bold text-base">Doğrula</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
