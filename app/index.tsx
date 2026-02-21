import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Auth from "@/lib/_core/auth";

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const colors = useColors();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log("[Index] Initializing app...");
      
      // Check onboarding first
      const onboardingCompleted = await AsyncStorage.getItem("@onboarding_completed");
      console.log("[Index] Onboarding completed:", onboardingCompleted);
      
      if (!onboardingCompleted) {
        console.log("[Index] First time user, showing onboarding");
        setInitializing(false);
        router.replace("/onboarding");
        return;
      }

      // Check for cached session
      const sessionToken = await Auth.getSessionToken();
      const cachedUser = await Auth.getUserInfo();
      
      console.log("[Index] Session check:", {
        hasToken: !!sessionToken,
        hasCachedUser: !!cachedUser,
        userId: cachedUser?.id,
      });

      if (sessionToken && cachedUser) {
        // User is logged in, go to main app
        console.log("[Index] User authenticated, redirecting to tabs");
        setInitializing(false);
        router.replace("/(tabs)");
      } else {
        // No session, go to login
        console.log("[Index] No session, redirecting to login");
        setInitializing(false);
        router.replace("/otp-login");
      }
    } catch (error) {
      console.error("[Index] Initialization error:", error);
      setInitializing(false);
      router.replace("/onboarding");
    }
  };

  // Loading screen
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
      <Text style={{ color: colors.muted, marginTop: 16 }}>
        Loading...
      </Text>
    </View>
  );
}
