import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { trpc } from "@/lib/trpc";

export function useProfilePicture() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = trpc.profile.uploadProfilePicture.useMutation();
  const updateMutation = trpc.profile.updateProfilePicture.useMutation();
  const deleteMutation = trpc.profile.deleteProfilePicture.useMutation();

  const pickImage = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const uploadResult = await uploadImage(imageUri);
        return uploadResult?.success || false;
      }
      return false;
    } catch (err) {
      setError("Resim seçilemedi");
      console.error("Error picking image:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setLoading(true);
      setError(null);

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine MIME type
      const mimeType = imageUri.endsWith(".png") ? "image/png" : "image/jpeg";

      // Upload to server
      const result = await uploadMutation.mutateAsync({
        fileContent,
        mimeType,
      });

      if (result.success) {
        return result;
      } else {
        setError(result.message || "Yükleme başarısız");
        return null;
      }
    } catch (err) {
      setError("Resim yüklenemedi");
      console.error("Error uploading image:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateImage = async (imageUri: string) => {
    try {
      setLoading(true);
      setError(null);

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine MIME type
      const mimeType = imageUri.endsWith(".png") ? "image/png" : "image/jpeg";

      // Update on server
      const result = await updateMutation.mutateAsync({
        fileContent,
        mimeType,
      });

      if (result.success) {
        return result;
      } else {
        setError(result.message || "Güncelleme başarısız");
      }
    } catch (err) {
      setError("Resim güncellenemedi");
      console.error("Error updating image:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await deleteMutation.mutateAsync();

      if (result.success) {
        return true;
      } else {
        setError(result.message || "Silme başarısız");
        return false;
      }
    } catch (err) {
      setError("Resim silinemedi");
      console.error("Error deleting image:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    pickImage,
    uploadImage,
    updateImage,
    deleteImage,
  };
}
