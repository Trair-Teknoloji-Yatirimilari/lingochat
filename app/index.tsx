import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const colors = useColors();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading) {
      checkOnboarding();
    }
  }, [loading, user]);

  const checkOnboarding = async () => {
    try {
      // Onboarding gösterildi mi kontrol et
      const onboardingCompleted = await AsyncStorage.getItem("@onboarding_completed");
      console.log("[Index] Onboarding completed:", onboardingCompleted);
      console.log("[Index] User:", user);
      console.log("[Index] Loading:", loading);
      
      if (!onboardingCompleted) {
        // İlk kez açılıyor, onboarding göster
        console.log("[Index] Redirecting to onboarding...");
        router.replace("/onboarding");
      } else {
        // Onboarding gösterilmiş, auth kontrolü yap
        if (!loading) {
          if (user) {
            // Kullanıcı giriş yapmış, ana sayfaya yönlendir
            console.log("[Index] Redirecting to tabs...");
            router.replace("/(tabs)");
          } else {
            // Kullanıcı giriş yapmamış, OTP login'e yönlendir
            console.log("[Index] Redirecting to otp-login...");
            router.replace("/otp-login");
          }
        }
      }
    } catch (error) {
      console.error("Onboarding check error:", error);
      // Hata durumunda onboarding'e yönlendir
      router.replace("/onboarding");
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Loading ekranı
  return (
    <View 
      style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
