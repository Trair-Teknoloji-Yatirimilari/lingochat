import { v2 as cloudinary } from "cloudinary";
import * as db from "./db";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a profile picture (store as data URL temporarily)
 */
export async function uploadProfilePicture(
  userId: number,
  fileContent: string, // base64 encoded
  mimeType: string
): Promise<{ url: string; publicId: string }> {
  try {
    // For now, store as data URL (base64) instead of Cloudinary
    // In production, you should use a proper cloud storage service
    const dataUrl = `data:${mimeType};base64,${fileContent}`;
    const publicId = `profile-${userId}-${Date.now()}`;

    // Update user profile in database
    await db.updateUserProfile(userId, {
      profilePictureUrl: dataUrl,
      profilePicturePublicId: publicId,
    });

    return {
      url: dataUrl,
      publicId: publicId,
    };
  } catch (error) {
    console.error("[ProfilePicture] Upload error:", error);
    throw new Error("Failed to upload profile picture");
  }
}

/**
 * Delete a profile picture
 */
export async function deleteProfilePicture(publicId: string): Promise<void> {
  try {
    // For data URL storage, we just remove from database
    // No need to delete from cloud storage
    console.log("[ProfilePicture] Deleting profile picture:", publicId);
  } catch (error) {
    console.error("[ProfilePicture] Delete error:", error);
    throw new Error("Failed to delete profile picture");
  }
}

/**
 * Update profile picture (delete old, upload new)
 */
export async function updateProfilePicture(
  userId: number,
  oldPublicId: string | null,
  fileContent: string,
  mimeType: string
): Promise<{ url: string; publicId: string }> {
  try {
    // Delete old picture if exists
    if (oldPublicId) {
      await deleteProfilePicture(oldPublicId);
    }

    // Upload new picture
    return await uploadProfilePicture(userId, fileContent, mimeType);
  } catch (error) {
    console.error("[ProfilePicture] Update error:", error);
    throw new Error("Failed to update profile picture");
  }
}

/**
 * Get profile picture URL
 */
export async function getProfilePicture(userId: number): Promise<string | null> {
  try {
    const profile = await db.getUserProfile(userId);
    return profile?.profilePictureUrl || null;
  } catch (error) {
    console.error("[ProfilePicture] Get error:", error);
    return null;
  }
}
