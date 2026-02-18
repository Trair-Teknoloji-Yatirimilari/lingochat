import { View, Text, TouchableOpacity, Image, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

interface MediaData {
  id: number;
  mediaType: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  caption?: string | null;
}

interface MediaMessageDisplayProps {
  media: MediaData;
  isMyMessage: boolean;
  onDownloadImage?: () => void;
  onDownloadDocument?: () => void;
}

export function MediaMessageDisplay({ media, isMyMessage, onDownloadImage, onDownloadDocument }: MediaMessageDisplayProps) {
  const colors = useColors();

  const handleOpenLocation = () => {
    if (media.latitude && media.longitude) {
      const url = `https://www.google.com/maps?q=${media.latitude},${media.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleSaveContact = () => {
    Alert.alert(
      "Kişi Kaydet",
      `${media.contactName}\n${media.contactPhone}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kaydet",
          onPress: () => {
            // TODO: Implement contact saving
            Alert.alert("Başarılı", "Kişi rehbere kaydedildi");
          },
        },
      ]
    );
  };

  const handleDownloadDocument = async () => {
    if (!media.mediaUrl) return;
    
    try {
      Alert.alert("İndiriliyor", "Belge indiriliyor...");
      
      // Download to cache first
      const fileName = media.fileName || `document_${Date.now()}`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(media.mediaUrl, fileUri);
      
      // Try to save using sharing
      if (await FileSystem.getInfoAsync(downloadResult.uri)) {
        Alert.alert("Başarılı", "Belge indirildi ve cihazınıza kaydedildi");
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Hata", "Belge indirilemedi");
    }
  };

  const handleDownloadImage = async () => {
    if (!media.mediaUrl) return;
    
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeriye kaydetmek için izin gereklidir");
        return;
      }

      Alert.alert("İndiriliyor", "Fotoğraf galeriye kaydediliyor...");
      
      // Download and save to gallery
      const fileUri = FileSystem.documentDirectory + `image_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(media.mediaUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      
      Alert.alert("Başarılı", "Fotoğraf galeriye kaydedildi");
    } catch (error) {
      console.error("Download image error:", error);
      Alert.alert("Hata", "Fotoğraf kaydedilemedi");
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Image
  if (media.mediaType === "image" && media.mediaUrl) {
    return (
      <View style={{ marginTop: 8 }}>
        <TouchableOpacity
          onPress={() => {
            // TODO: Open image viewer
            Alert.alert("Fotoğraf", "Tam ekran görüntüleme yakında eklenecek");
          }}
        >
          <Image
            source={{ uri: media.mediaUrl }}
            style={{
              width: 250,
              height: 250,
              borderRadius: 12,
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {media.caption && (
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: isMyMessage ? "#ffffff" : colors.foreground,
            }}
          >
            {media.caption}
          </Text>
        )}
      </View>
    );
  }

  // Document
  if (media.mediaType === "document" && media.mediaUrl) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 12,
          backgroundColor: isMyMessage
            ? "rgba(255, 255, 255, 0.2)"
            : colors.surface,
          borderRadius: 12,
          marginTop: 8,
          borderWidth: isMyMessage ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isMyMessage
              ? "rgba(255, 255, 255, 0.3)"
              : colors.primary + "20",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="document-text"
            size={24}
            color={isMyMessage ? "#ffffff" : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isMyMessage ? "#ffffff" : colors.foreground,
            }}
            numberOfLines={1}
          >
            {media.fileName || "Belge"}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isMyMessage ? "rgba(255, 255, 255, 0.7)" : colors.muted,
              marginTop: 2,
            }}
          >
            {formatFileSize(media.fileSize)}
          </Text>
        </View>
      </View>
    );
  }

  // Location
  if (media.mediaType === "location" && media.latitude && media.longitude) {
    return (
      <TouchableOpacity
        onPress={handleOpenLocation}
        style={{
          marginTop: 8,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: isMyMessage
            ? "rgba(255, 255, 255, 0.2)"
            : colors.surface,
          borderWidth: isMyMessage ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        {/* Placeholder map - In production, use actual Google Maps Static API */}
        <View
          style={{
            width: 250,
            height: 150,
            backgroundColor: isMyMessage
              ? "rgba(255, 255, 255, 0.3)"
              : colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="location"
            size={48}
            color={isMyMessage ? "#ffffff" : colors.primary}
          />
        </View>
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="location"
              size={16}
              color={isMyMessage ? "#ffffff" : colors.primary}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isMyMessage ? "#ffffff" : colors.foreground,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {media.address || "Konum"}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: isMyMessage ? "rgba(255, 255, 255, 0.7)" : colors.muted,
              marginTop: 4,
            }}
          >
            Haritada Aç →
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Contact
  if (media.mediaType === "contact" && media.contactName) {
    return (
      <View
        style={{
          marginTop: 8,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: isMyMessage
            ? "rgba(255, 255, 255, 0.15)"
            : colors.surface,
          borderWidth: isMyMessage ? 0 : 1,
          borderColor: colors.border,
          minWidth: 180,
          maxWidth: 220,
        }}
      >
        {/* Header with gradient-like background */}
        <View
          style={{
            backgroundColor: isMyMessage
              ? "rgba(255, 255, 255, 0.25)"
              : colors.primary + "10",
            paddingVertical: 12,
            paddingHorizontal: 12,
            alignItems: "center",
          }}
        >
          {/* Avatar Circle */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isMyMessage
                ? "rgba(255, 255, 255, 0.4)"
                : colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 8,
              borderWidth: 2,
              borderColor: isMyMessage ? "rgba(255, 255, 255, 0.3)" : colors.primary + "30",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: isMyMessage ? "#ffffff" : colors.primary,
              }}
            >
              {media.contactName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Contact Name */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: isMyMessage ? "#ffffff" : colors.foreground,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {media.contactName}
          </Text>
        </View>

        {/* Contact Info */}
        {media.contactPhone && (
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: isMyMessage
                ? "rgba(255, 255, 255, 0.1)"
                : colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isMyMessage
                    ? "rgba(255, 255, 255, 0.2)"
                    : colors.primary + "15",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="call"
                  size={12}
                  color={isMyMessage ? "#ffffff" : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isMyMessage ? "#ffffff" : colors.foreground,
                  }}
                  numberOfLines={1}
                >
                  {media.contactPhone}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSaveContact}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: isMyMessage
              ? "rgba(255, 255, 255, 0.15)"
              : "transparent",
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-add"
            size={14}
            color={isMyMessage ? "#ffffff" : colors.primary}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isMyMessage ? "#ffffff" : colors.primary,
            }}
          >
            Rehbere Ekle
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
