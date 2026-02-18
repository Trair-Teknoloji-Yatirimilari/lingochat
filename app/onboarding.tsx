import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    id: 1,
    icon: "chatbubbles" as const,
    iconColor: "#FF5722",
    title: "LingoChat'e\nHoş Geldin",
    description: "Dil bariyerlerini ortadan kaldıran, dünyayı birleştiren yeni nesil mesajlaşma platformu",
    gradient: ["#FF5722", "#FF6B35"],
  },
  {
    id: 2,
    icon: "language" as const,
    iconColor: "#FF6B35",
    title: "İstediğin Dilde\nKonuş",
    description: "Mesajını istediğin dilde yaz, karşı taraf kendi dilinde okusun. Artık dil engeli yok!",
    gradient: ["#FF6B35", "#FF8A50"],
  },
  {
    id: 3,
    icon: "globe-outline" as const,
    iconColor: "#FF7043",
    title: "Anlık Çeviri\nTeknolojisi",
    description: "Yapay zeka destekli otomatik çeviri ile 100+ dilde anında iletişim kur",
    gradient: ["#FF7043", "#FF8A65"],
  },
  {
    id: 4,
    icon: "shield-checkmark" as const,
    iconColor: "#FF5722",
    title: "Güvenli & Özel",
    description: "Uçtan uca şifreli mesajlaşma. Gizliliğin bizim için her zaman öncelik",
    gradient: ["#FF5722", "#FF6B35"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
      },
    }
  );

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    // Onboarding'in gösterildiğini kaydet
    await AsyncStorage.setItem("@onboarding_completed", "true");
    router.replace("/otp-login");
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Slides */}
        <View className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {ONBOARDING_SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={{ width }}
                className="flex-1 items-center justify-center px-8"
              >
                {/* Icon */}
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: slide.iconColor + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 40,
                    shadowColor: slide.iconColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Ionicons name={slide.icon} size={70} color={slide.iconColor} />
                </View>

                {/* Title */}
                <Text
                  className="text-4xl font-bold text-center mb-6 px-4"
                  style={{ color: colors.foreground, lineHeight: 48 }}
                >
                  {slide.title}
                </Text>

                {/* Description */}
                <Text
                  className="text-lg text-center leading-relaxed px-6"
                  style={{ color: colors.muted, lineHeight: 28 }}
                >
                  {slide.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Section - Sabit Pozisyon */}
        <View className="pb-12 px-6">
          {/* Pagination Dots */}
          <View className="flex-row justify-center items-center mb-8">
            {ONBOARDING_SLIDES.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  style={{
                    width: dotWidth,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    opacity,
                    marginHorizontal: 4,
                  }}
                />
              );
            })}
          </View>

          {/* Next/Get Started Button - Her Zaman Aynı Yerde */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-base">
              {currentIndex === ONBOARDING_SLIDES.length - 1
                ? "Başlayalım"
                : "Devam"}
            </Text>
          </TouchableOpacity>

          {/* Login Link - Her Sayfada Alan Kaplar, Sadece Son Sayfada Görünür */}
          <View style={{ height: 60, justifyContent: "center" }}>
            {currentIndex === ONBOARDING_SLIDES.length - 1 && (
              <TouchableOpacity
                onPress={handleGetStarted}
                className="py-3"
              >
                <Text className="text-center text-sm" style={{ color: colors.muted }}>
                  Zaten hesabın var mı?{" "}
                  <Text className="font-semibold" style={{ color: colors.primary }}>
                    Giriş Yap
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
