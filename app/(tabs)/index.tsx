import { ScrollView, Text, View, TouchableOpacity, Animated, Pressable } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

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
  }, []);

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
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        {/* Compact Hero */}
        <View className="items-center mb-6">
          <View 
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons name="chatbubbles" size={32} color={colors.background} />
          </View>
          <Text className="text-3xl font-bold text-foreground mb-1">
            LingoChat
          </Text>
          <Text className="text-sm text-muted text-center">
            Dil engellerini kaldır, dünyayla bağlan
          </Text>
        </View>

        {/* Welcome Card with Animation */}
        <Animated.View 
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <View className="flex-row items-center gap-4 mb-3">
            <Animated.View 
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
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
              <Text className="text-3xl">👋</Text>
            </Animated.View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground mb-1">
                Hoş geldin, {profileQuery.data?.username || "Kullanıcı"}!
              </Text>
              <Text className="text-sm text-muted">
                Bugün kiminle konuşmak istersin?
              </Text>
            </View>
          </View>

          {/* Language Selector Dropdown */}
          <TouchableOpacity
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            style={{
              backgroundColor: colors.primary + "15",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">{currentLanguage.flag}</Text>
              <Text className="text-sm text-foreground font-semibold">
                {currentLanguage.name}
              </Text>
            </View>
            <Ionicons 
              name={showLanguageDropdown ? "chevron-up" : "chevron-down"} 
              size={18} 
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
        <View className="mb-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/new-chat")}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Ionicons name="add-circle" size={24} color={colors.background} />
              <Text className="text-background font-semibold text-sm mt-1">
                Yeni Sohbet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/chats")}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              <Text className="text-foreground font-semibold text-sm mt-1">
                Sohbetlerim
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Features Grid */}
        <View className="mb-4">
          <Text className="text-base font-bold text-foreground mb-3">
            Özellikler
          </Text>
          <View className="gap-2">
            <View className="flex-row gap-2">
              <CompactFeatureCard
                iconName="globe-outline"
                iconColor="#4CAF50"
                title="Yapay Zeka Çevirisi"
              />
              <CompactFeatureCard
                iconName="flash-outline"
                iconColor="#FF9800"
                title="Anlık Mesajlaşma"
              />
            </View>
            <View className="flex-row gap-2">
              <CompactFeatureCard
                iconName="shield-checkmark-outline"
                iconColor="#2196F3"
                title="Güvenli & Özel"
              />
              <CompactFeatureCard
                iconName="images-outline"
                iconColor="#9C27B0"
                title="Medya Paylaşımı"
              />
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View 
          style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 12,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text className="text-xs text-foreground flex-1 leading-relaxed">
              Mesajlar otomatik olarak tercih ettiğin dile çevrilir
            </Text>
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
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}) {
  const colors = useColors();

  return (
    <View 
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 6,
      }}
    >
      <View 
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: iconColor + "20",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <Text className="text-xs font-semibold text-foreground text-center">
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
