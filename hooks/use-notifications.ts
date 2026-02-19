import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import Constants from "expo-constants";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Setup Android notification channel
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0a7ea4",
      });
    }

    // Register for push notifications
    registerForPushNotificationsAsync();

    // Listen for notifications when app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 Notification received:", notification);
      });

    // Listen for notification responses (when user taps notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
        
        // Handle navigation based on notification data
        const data = response.notification.request.content.data;
        if (data?.conversationId) {
          // Navigate to conversation
          console.log("Navigate to conversation:", data.conversationId);
        } else if (data?.roomId) {
          // Navigate to room
          console.log("Navigate to room:", data.roomId);
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === "web") {
      console.log("Push notifications not supported on web");
      return null;
    }

    // Skip device check for now - just try to get permissions
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      // If no projectId, skip push notifications (development mode)
      if (!projectId) {
        console.log("⚠️ No projectId found, skipping push notifications");
        return null;
      }
      
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })
      ).data;

      console.log("📱 Expo Push Token:", token);
      setExpoPushToken(token);

      // Register token with backend (will be done later when tRPC is ready)
      // We'll use a separate effect or component to register the token
      
      return token;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  };

  const requestNotificationPermissions = async () => {
    if (Platform.OS === "web") {
      return false;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      return false;
    }
  };

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: "default",
          badge: 1,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  return {
    expoPushToken,
    sendLocalNotification,
    requestNotificationPermissions,
  };
}
