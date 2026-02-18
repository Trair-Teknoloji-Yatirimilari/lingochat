import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { COUNTRIES_SORTED, searchCountries, type Country } from "@/data/countries";

export default function OTPLoginEnhancedScreen() {
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES_SORTED[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [error, setError] = useState("");

  const filteredCountries = countrySearch
    ? searchCountries(countrySearch)
    : COUNTRIES_SORTED;

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
    setCountrySearch("");
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Telefon numarası giriniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate OTP sending
      // In real app, call backend API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep("otp");
    } catch (err) {
      setError("OTP gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("6 haneli OTP giriniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate OTP verification
      // In real app, call backend API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.replace("/(tabs)");
    } catch (err) {
      setError("OTP doğrulanamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 justify-center">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">LingoChat</Text>
            <Text className="text-base text-muted text-center">
              {step === "phone"
                ? "Telefon numaranızı girin"
                : "OTP kodunuzu girin"}
            </Text>
          </View>

          {/* Phone Input Step */}
          {step === "phone" && (
            <View className="gap-4">
              {/* Country Selector */}
              <Pressable
                onPress={() => setShowCountryModal(true)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.8 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                className="flex-row items-center p-4 rounded-xl"
              >
                <Text className="text-3xl mr-3">{selectedCountry.flag}</Text>
                <View className="flex-1">
                  <Text className="text-sm text-muted">Ülke</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {selectedCountry.name}
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-primary">
                  {selectedCountry.phoneCode}
                </Text>
              </Pressable>

              {/* Phone Number Input */}
              <View
                style={{ borderColor: colors.border }}
                className="flex-row items-center border rounded-xl px-4 bg-surface"
              >
                <Text className="text-lg font-semibold text-primary mr-2">
                  {selectedCountry.phoneCode}
                </Text>
                <TextInput
                  placeholder="Telefon numarası"
                  placeholderTextColor={colors.muted}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text.replace(/\D/g, ""));
                    setError("");
                  }}
                  keyboardType="phone-pad"
                  editable={!loading}
                  className="flex-1 py-4 text-foreground"
                  style={{ color: colors.foreground }}
                />
              </View>

              {/* Error Message */}
              {error && <Text className="text-error text-sm">{error}</Text>}

              {/* Send OTP Button */}
              <Pressable
                onPress={handleSendOTP}
                disabled={loading}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed || loading ? 0.8 : 1,
                  },
                ]}
                className="p-4 rounded-xl items-center mt-4"
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="text-background font-bold text-lg">OTP Gönder</Text>
                )}
              </Pressable>

              {/* Format Helper */}
              <Text className="text-xs text-muted text-center mt-4">
                Format: {selectedCountry.format}
              </Text>
            </View>
          )}

          {/* OTP Input Step */}
          {step === "otp" && (
            <View className="gap-4">
              {/* OTP Input */}
              <View
                style={{ borderColor: colors.border }}
                className="border rounded-xl px-4 bg-surface items-center"
              >
                <TextInput
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  className="py-4 text-center text-2xl font-bold text-foreground tracking-widest"
                  style={{ color: colors.foreground }}
                />
              </View>

              {/* Error Message */}
              {error && <Text className="text-error text-sm text-center">{error}</Text>}

              {/* Verify Button */}
              <Pressable
                onPress={handleVerifyOTP}
                disabled={loading}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed || loading ? 0.8 : 1,
                  },
                ]}
                className="p-4 rounded-xl items-center mt-4"
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="text-background font-bold text-lg">Doğrula</Text>
                )}
              </Pressable>

              {/* Back Button */}
              <Pressable
                onPress={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                disabled={loading}
                className="p-3 items-center mt-2"
              >
                <Text className="text-primary font-semibold">Telefon Numarasını Değiştir</Text>
              </Pressable>

              {/* Resend OTP */}
              <Text className="text-xs text-muted text-center mt-4">
                OTP'yi almadınız mı?{" "}
                <Text className="text-primary font-semibold">Yeniden Gönder</Text>
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View className="flex-1">
            {/* Search Bar */}
            <View className="p-4 border-b" style={{ borderColor: colors.border }}>
              <TextInput
                placeholder="Ülke ara..."
                placeholderTextColor={colors.muted}
                value={countrySearch}
                onChangeText={setCountrySearch}
                className="p-3 rounded-lg bg-surface text-foreground"
                style={{ color: colors.foreground }}
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectCountry(item)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.surface : colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  })}
                  className="flex-row items-center p-4"
                >
                  <Text className="text-2xl mr-3">{item.flag}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-sm text-muted">{item.phoneCode}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
