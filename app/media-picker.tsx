import { View, TouchableOpacity, Text, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { useState } from "react";

export default function MediaPickerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { pickImage, pickVideo, uploadMedia, uploading, uploadProgress } =
    useMediaUpload();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const conversationId_num = conversationId ? parseInt(conversationId, 10) : 0;

  const handlePickImage = async () => {
    const file = await pickImage();
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePickVideo = async () => {
    const file = await pickVideo();
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !conversationId_num) return;

    try {
      const mediaUrl = await uploadMedia(selectedFile, conversationId_num);
      if (mediaUrl) {
        Alert.alert("Success", "Media uploaded successfully");
        router.back();
      } else {
        Alert.alert("Error", "Failed to upload media");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload media");
      console.error(error);
    }
  };

  return (
    <ScreenContainer className="p-6 gap-4">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Share Media</Text>
      </View>

      {/* Selected File Info */}
      {selectedFile && (
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-foreground font-semibold mb-2">
            Selected: {selectedFile.name}
          </Text>
          <Text className="text-muted text-sm">
            Type: {selectedFile.type}
          </Text>
          {selectedFile.size && (
            <Text className="text-muted text-sm">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Text>
          )}
        </View>
      )}

      {/* Upload Progress */}
      {uploading && (
        <View className="bg-surface rounded-lg p-4 border border-border">
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color={colors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Uploading...</Text>
              <Text className="text-muted text-sm">{uploadProgress}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="gap-3">
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={uploading}
          className={`p-4 rounded-lg flex-row items-center gap-3 ${
            uploading ? "bg-border" : "bg-primary"
          }`}
        >
          <Ionicons
            name="image"
            size={24}
            color={uploading ? colors.muted : "#ffffff"}
          />
          <Text
            className={`font-semibold ${
              uploading ? "text-muted" : "text-background"
            }`}
          >
            Pick Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePickVideo}
          disabled={uploading}
          className={`p-4 rounded-lg flex-row items-center gap-3 ${
            uploading ? "bg-border" : "bg-primary"
          }`}
        >
          <Ionicons
            name="videocam"
            size={24}
            color={uploading ? colors.muted : "#ffffff"}
          />
          <Text
            className={`font-semibold ${
              uploading ? "text-muted" : "text-background"
            }`}
          >
            Pick Video
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            className={`p-4 rounded-lg flex-row items-center justify-center gap-3 ${
              uploading ? "bg-border" : "bg-success"
            }`}
          >
            {uploading ? (
              <ActivityIndicator color={colors.muted} />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#ffffff" />
            )}
            <Text className={`font-semibold text-background`}>
              {uploading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={uploading}
          className={`p-4 rounded-lg flex-row items-center justify-center gap-3 ${
            uploading ? "bg-border" : "bg-border"
          }`}
        >
          <Ionicons
            name="close"
            size={24}
            color={uploading ? colors.muted : colors.foreground}
          />
          <Text
            className={`font-semibold ${
              uploading ? "text-muted" : "text-foreground"
            }`}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
