import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";

const LANGUAGES = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("tr");

  const handleSelectLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Save language preference to AsyncStorage
    // Then navigate to OTP login
    setTimeout(() => {
      router.replace("/otp-login");
    }, 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 justify-center">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">{t('languageSelection.title')}</Text>
            <Text className="text-base text-muted text-center">
              {t('languageSelection.subtitle')}
            </Text>
          </View>

          {/* Language Grid */}
          <View className="gap-3">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => handleSelectLanguage(lang.code)}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      selectedLanguage === lang.code ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                    borderWidth: 2,
                    borderColor:
                      selectedLanguage === lang.code ? colors.primary : colors.border,
                  },
                ]}
                className="flex-row items-center p-4 rounded-xl"
              >
                <Text className="text-3xl mr-4">{lang.flag}</Text>
                <Text
                  className={`text-lg font-semibold flex-1 ${
                    selectedLanguage === lang.code ? "text-background" : "text-foreground"
                  }`}
                >
                  {lang.name}
                </Text>
                {selectedLanguage === lang.code && (
                  <Text className="text-2xl text-background">✓</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Continue Button */}
          <Pressable
            onPress={() => handleSelectLanguage(selectedLanguage)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            className="mt-8 p-4 rounded-xl items-center"
          >
            <Text className="text-background font-bold text-lg">{t('languageSelection.continue')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
