import { ScrollView, Text, View, TouchableOpacity, Animated, Pressable } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import ReanimatedAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function HomeScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const profileQuery = trpc.profile.get.useQuery();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Reanimated values for button animations
  const buttonScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const iconScale = useSharedValue(1);

  const updateLanguageMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setShowLanguageDropdown(false);
    },
  });

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Wave animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon rotation animation loop
    iconRotation.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(90, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ),
      -1,
      false
    );

    // Icon pulse animation
    iconScale.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 10 }),
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 10 })
      ),
      -1,
      false
    );
  }, []);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${iconRotation.value}deg` },
      { scale: iconScale.value },
    ],
  }));

  const LANGUAGES = [
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "en", name: "İngilizce", flag: "🇬🇧" },
    { code: "es", name: "İspanyolca", flag: "🇪🇸" },
    { code: "fr", name: "Fransızca", flag: "🇫🇷" },
    { code: "de", name: "Almanca", flag: "🇩🇪" },
    { code: "ja", name: "Japonca", flag: "🇯🇵" },
    { code: "zh", name: "Çince", flag: "🇨🇳" },
  ];

  const preferredLang = profileQuery.data?.preferredLanguage || "tr";
  const currentLanguage = LANGUAGES.find((l) => l.code === preferredLang) || LANGUAGES[0];

  const handleLanguageChange = (languageCode: string) => {
    updateLanguageMutation.mutate({ preferredLanguage: languageCode });
  };

  return (
    <ScreenContainer>
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        {/* Compact Hero */}
        <View className="items-center mb-4">
          <View 
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 8,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <Ionicons name="chatbubbles" size={28} color={colors.background} />
          </View>
          <Text className="text-2xl font-bold text-foreground mb-0.5">
            LingoChat
          </Text>
          <Text className="text-xs text-muted text-center">
            Dil engellerini kaldır, dünyayla bağlan
          </Text>
        </View>

        {/* Welcome Card with Animation */}
        <Animated.View 
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <Animated.View 
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
                transform: [
                  {
                    rotate: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '20deg'],
                    }),
                  },
                ],
              }}
            >
              <Text className="text-2xl">👋</Text>
            </Animated.View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-0.5">
                Hoş geldin, {profileQuery.data?.username || "Kullanıcı"}!
              </Text>
              <Text className="text-xs text-muted">
                Bugün kiminle konuşmak istersin?
              </Text>
            </View>
          </View>

          {/* Language Selector Dropdown */}
          <TouchableOpacity
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            style={{
              backgroundColor: colors.primary + "15",
              borderRadius: 10,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-base">{currentLanguage.flag}</Text>
              <Text className="text-xs text-foreground font-semibold">
                {currentLanguage.name}
              </Text>
            </View>
            <Ionicons 
              name={showLanguageDropdown ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.primary} 
            />
          </TouchableOpacity>

          {/* Language Dropdown Menu */}
          {showLanguageDropdown && (
            <View 
              style={{
                marginTop: 10,
                backgroundColor: colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {LANGUAGES.map((lang, index) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    gap: 10,
                    backgroundColor: 
                      lang.code === preferredLang 
                        ? colors.primary + "10" 
                        : "transparent",
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text className="text-lg">{lang.flag}</Text>
                  <Text 
                    className="text-sm flex-1"
                    style={{
                      color: colors.foreground,
                      fontWeight: lang.code === preferredLang ? "600" : "400",
                    }}
                  >
                    {lang.name}
                  </Text>
                  {lang.code === preferredLang && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Quick Actions - Compact */}
        <View className="mb-3">
          <View className="flex-row gap-3">
            <ReanimatedAnimated.View style={[{ flex: 1 }, animatedButtonStyle]}>
              <TouchableOpacity
                onPress={() => router.push("/new-chat")}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: "center",
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <ReanimatedAnimated.View style={animatedIconStyle}>
                  <Ionicons name="add-circle" size={22} color={colors.background} />
                </ReanimatedAnimated.View>
                <Text className="text-background font-semibold text-xs mt-1">
                  Yeni Sohbet
                </Text>
              </TouchableOpacity>
            </ReanimatedAnimated.View>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/chats")}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
              <Text className="text-foreground font-semibold text-xs mt-1">
                Sohbetlerim
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Features Grid */}
        <View className="mb-3">
          <Text className="text-sm font-bold text-foreground mb-2">
            Öne Çıkan Özellikler
          </Text>
          <View className="gap-2">
            <View className="flex-row gap-2">
              <CompactFeatureCard
                iconName="sparkles"
                iconColor="#FF6B6B"
                title="AI Toplantı Özeti"
                badge="YENİ"
              />
              <CompactFeatureCard
                iconName="time-outline"
                iconColor="#4ECDC4"
                title="Otomatik Silinen Mesajlar"
                badge="PRO"
              />
            </View>
            <View className="flex-row gap-2">
              <CompactFeatureCard
                iconName="mic"
                iconColor="#95E1D3"
                title="Sesli Çeviri"
                badge="YAKINDA"
              />
              <CompactFeatureCard
                iconName="document-text"
                iconColor="#F38181"
                title="Belge Analizi"
                badge="YAKINDA"
              />
            </View>
          </View>
        </View>

        {/* Info Banner - Premium */}
        <View 
          style={{
            backgroundColor: colors.primary + "15",
            borderRadius: 12,
            padding: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View className="flex-row items-start gap-2">
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.primary + "30",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="rocket" size={14} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text 
                className="text-xs font-bold mb-0.5"
                style={{ color: colors.primary }}
              >
                Dil Engeli Yok! 🌍
              </Text>
              <Text className="text-xs text-muted leading-relaxed" style={{ fontSize: 11 }}>
                Mesajlar otomatik çevrilir. Sen Türkçe yaz, karşı taraf İngilizce okusun!
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

function CompactFeatureCard({
  iconName,
  iconColor,
  title,
  badge,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  badge?: string;
}) {
  const colors = useColors();

  // Badge colors
  const getBadgeStyle = () => {
    switch (badge) {
      case "YENİ":
        return { bg: "#FF6B6B", text: "#FFFFFF" };
      case "PRO":
        return { bg: "#4ECDC4", text: "#FFFFFF" };
      case "YAKINDA":
        return { bg: colors.muted, text: "#FFFFFF" };
      default:
        return { bg: colors.primary, text: "#FFFFFF" };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <View 
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
        position: "relative",
      }}
    >
      {/* Badge */}
      {badge && (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            backgroundColor: badgeStyle.bg,
            paddingHorizontal: 5,
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              fontWeight: "700",
              color: badgeStyle.text,
              letterSpacing: 0.3,
            }}
          >
            {badge}
          </Text>
        </View>
      )}

      {/* Icon */}
      <View 
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: iconColor + "20",
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
        }}
      >
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>

      {/* Title */}
      <Text 
        className="text-xs font-semibold text-foreground text-center"
        numberOfLines={2}
        style={{ lineHeight: 13, fontSize: 10 }}
      >
        {title}
      </Text>
    </View>
  );
}

function FeatureCard({
  iconName,
  iconColor,
  title,
  description,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
}) {
  const colors = useColors();

  return (
    <View 
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
      }}
    >
      <View 
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: iconColor + "20",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-foreground">
          {title}
        </Text>
        <Text className="text-sm text-muted leading-relaxed">
          {description}
        </Text>
      </View>
    </View>
  );
}
