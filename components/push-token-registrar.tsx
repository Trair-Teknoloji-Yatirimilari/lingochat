import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { trpc } from "@/lib/trpc";

/**
 * Component to register push notification token with backend
 * This runs after tRPC is initialized
 */
export function PushTokenRegistrar() {
  const registerTokenMutation = trpc.pushNotifications.registerToken.useMutation();

  useEffect(() => {
    registerPushToken();
  }, []);

  const registerPushToken = async () => {
    if (Platform.OS === "web") {
      return;
    }

    try {
      // Check if we have permission
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log("⚠️ No projectId found, skipping push notifications");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;

      // Register with backend
      await registerTokenMutation.mutateAsync({
        token,
        platform: Platform.OS as "ios" | "android",
        deviceId: undefined,
      });

      console.log("✅ Push token registered with backend");
    } catch (error) {
      console.error("❌ Failed to register push token:", error);
    }
  };

  return null; // This component doesn't render anything
}
