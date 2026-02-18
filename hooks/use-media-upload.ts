import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { trpc } from "@/lib/trpc";

export interface MediaFile {
  uri: string;
  name: string;
  type: "image" | "video" | "file";
  mimeType?: string;
  size?: number;
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMediaMutation = trpc.media.upload.useMutation();

  const pickImage = useCallback(async (): Promise<MediaFile | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "image.jpg";

        return {
          uri: asset.uri,
          name: fileName,
          type: "image",
          mimeType: "image/jpeg",
          size: asset.fileSize,
        };
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
    return null;
  }, []);

  const pickVideo = useCallback(async (): Promise<MediaFile | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "video.mp4";

        return {
          uri: asset.uri,
          name: fileName,
          type: "video",
          mimeType: "video/mp4",
          size: asset.fileSize,
        };
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
    return null;
  }, []);

  const uploadMedia = useCallback(
    async (
      mediaFile: MediaFile,
      conversationId: number,
      caption?: string
    ): Promise<string | null> => {
      if (!mediaFile) return null;

      setUploading(true);
      setUploadProgress(0);

      try {
        // Read file as base64
        const fileContent = await FileSystem.readAsStringAsync(mediaFile.uri, {
          encoding: 'base64' as any,
        });

        // Upload to server which will handle Cloudinary upload
        const response = await uploadMediaMutation.mutateAsync({
          conversationId,
          fileName: mediaFile.name,
          mimeType: mediaFile.mimeType || "application/octet-stream",
          fileSize: mediaFile.size || 0,
          mediaType: mediaFile.type,
          fileContent,
          caption,
        });

        setUploadProgress(100);
        return response.mediaUrl;
      } catch (error) {
        console.error("Error uploading media:", error);
        return null;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadMediaMutation]
  );

  return {
    pickImage,
    pickVideo,
    uploadMedia,
    uploading,
    uploadProgress,
  };
}
