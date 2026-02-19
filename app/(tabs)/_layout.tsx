import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image, View, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
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

// Floating Action Button Component
function FloatingActionButton() {
  const colors = useColors();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    router.push("/new-chat");
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 70 + bottomPadding;

  return (
    <>
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
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={Platform.OS === "ios" ? 80 : 100}
              tint="light"
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: Platform.OS === "ios" 
                  ? "rgba(255, 255, 255, 0.7)" 
                  : colors.background + "F0",
                borderTopWidth: 0.5,
                borderTopColor: colors.border + "40",
              }}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Ana Sayfa",
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
          name="search"
          options={{
            title: "Ara",
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol 
                size={26} 
                name={focused ? "phone.fill" : "phone"} 
                color={color} 
              />
            ),
          }}
        />
        
        {/* Placeholder for FAB */}
        <Tabs.Screen
          name="chats"
          options={{
            title: "",
            tabBarIcon: () => null,
            tabBarButton: () => <View style={{ width: 60 }} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        
        <Tabs.Screen
          name="groups"
          options={{
            title: "Grup",
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
            title: "Profil",
            tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
          }}
        />
      </Tabs>
      
      {/* Floating Action Button */}
      <View style={[styles.fabContainer, { bottom: tabBarHeight - 28 }]}>
        <FloatingActionButton />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
});
