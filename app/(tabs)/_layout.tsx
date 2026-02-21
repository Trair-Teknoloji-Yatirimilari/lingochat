import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image, View, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";

function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const colors = useColors();
  const profileQuery = trpc.profile.get.useQuery();
  const profilePictureUrl = profileQuery.data?.profilePictureUrl;

  if (profilePictureUrl) {
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: focused ? 2 : 0,
          borderColor: color,
        }}
      >
        <Image
          source={{ uri: profilePictureUrl }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary + "20",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: focused ? 2 : 0,
        borderColor: color,
      }}
    >
      <Ionicons name="person" size={16} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 70 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          paddingTop: 12,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background + "F5",
          borderTopWidth: 0.5,
          borderTopColor: colors.border + "60",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={26} 
              name={focused ? "house.fill" : "house"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t('tabs.chats'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={26} 
              name={focused ? "paperplane.fill" : "paperplane"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={26} 
              name={focused ? "person.3.fill" : "person.3"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
        }}
      />
      
      {/* Hidden tab - only accessible via navigation */}
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
