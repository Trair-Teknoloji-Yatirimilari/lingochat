import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
];

export default function LoginScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const [loading, setLoading] = useState(false);

  const createProfileMutation = trpc.profile.create.useMutation();

  const handleCompleteSignUp = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setLoading(true);
    try {
      await createProfileMutation.mutateAsync({
        username: username.trim(),
        preferredLanguage: selectedLanguage,
      });
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Failed to create profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <ScreenContainer className="justify-center items-center">
        <View className="gap-4">
          <Text className="text-2xl font-bold text-foreground text-center">
            Welcome to LingoChat
          </Text>
          <Text className="text-base text-muted text-center">
            Complete your profile to get started
          </Text>

          <TextInput
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            className="border border-border rounded-lg p-3 text-foreground"
            placeholderTextColor="#9BA1A6"
          />

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Preferred Language
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="gap-2"
              contentContainerStyle={{ gap: 8 }}
            >
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setSelectedLanguage(lang.code)}
                  className={`px-4 py-2 rounded-full ${
                    selectedLanguage === lang.code
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedLanguage === lang.code
                        ? "text-background"
                        : "text-foreground"
                    }`}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            onPress={handleCompleteSignUp}
            disabled={loading}
            className="bg-primary rounded-lg p-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-background font-semibold">
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="justify-center p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View className="gap-8">
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">
              LingoChat
            </Text>
            <Text className="text-base text-muted text-center">
              Break language barriers, connect globally
            </Text>
          </View>

          <View className="gap-4">
            <TouchableOpacity
              onPress={() => {
                // OAuth login will be handled by useAuth hook
              }}
              className="bg-primary rounded-lg p-4 items-center"
            >
              <Text className="text-background font-semibold">
                Sign In / Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
