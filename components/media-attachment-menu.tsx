import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";

interface MediaAttachmentMenuProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string, type: "camera" | "gallery") => void;
  onDocumentSelected: (document: DocumentPicker.DocumentPickerAsset) => void;
  onLocationSelected: (location: { latitude: number; longitude: number; address?: string }) => void;
  onContactSelected: (contact: any) => void;
}

export function MediaAttachmentMenu({
  visible,
  onClose,
  onImageSelected,
  onDocumentSelected,
  onLocationSelected,
  onContactSelected,
}: MediaAttachmentMenuProps) {
  const colors = useColors();

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Kamera kullanmak için izin vermelisiniz");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri, "camera");
        onClose();
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Hata", "Kamera açılamadı");
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeriye erişmek için izin vermelisiniz");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri, "gallery");
        onClose();
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Hata", "Galeri açılamadı");
    }
  };

  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        onDocumentSelected(result.assets[0]);
        onClose();
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Hata", "Belge seçilemedi");
    }
  };

  const handleLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Konum paylaşmak için izin vermelisiniz");
        return;
      }

      Alert.alert("Konum Alınıyor", "Lütfen bekleyin...");
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressString = address[0]
        ? `${address[0].street || ""} ${address[0].district || ""} ${address[0].city || ""}`
        : undefined;

      onLocationSelected({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: addressString,
      });
      onClose();
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Hata", "Konum alınamadı");
    }
  };

  const handleContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Kişi paylaşmak için izin vermelisiniz");
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (data.length > 0) {
        // For now, we'll show a simple picker
        // In production, you'd show a proper contact picker UI
        Alert.alert(
          "Kişi Seç",
          "Rehber açılacak (UI geliştirme aşamasında)",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Test Kişisi Gönder",
              onPress: () => {
                onContactSelected({
                  name: data[0].name,
                  phoneNumbers: data[0].phoneNumbers,
                });
                onClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Contact picker error:", error);
      Alert.alert("Hata", "Kişi seçilemedi");
    }
  };

  const menuItems = [
    {
      icon: "camera" as const,
      label: "Kamera",
      color: "#ef4444",
      onPress: handleCamera,
    },
    {
      icon: "images" as const,
      label: "Galeri",
      color: "#8b5cf6",
      onPress: handleGallery,
    },
    {
      icon: "document-text" as const,
      label: "Belge",
      color: "#3b82f6",
      onPress: handleDocument,
    },
    {
      icon: "location" as const,
      label: "Konum",
      color: "#10b981",
      onPress: handleLocation,
    },
    {
      icon: "person" as const,
      label: "Kişi",
      color: "#f59e0b",
      onPress: handleContact,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
        >
          {/* Handle Bar */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: colors.foreground,
              paddingHorizontal: 20,
              marginBottom: 16,
            }}
          >
            Ekle
          </Text>

          {/* Menu Items */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 20,
              gap: 16,
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                style={{
                  alignItems: "center",
                  width: "30%",
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: item.color + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.foreground,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
