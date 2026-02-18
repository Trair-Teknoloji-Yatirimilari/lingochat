import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import {
  uploadProfilePicture,
  deleteProfilePicture,
  updateProfilePicture,
  getProfilePicture,
} from "./profile-picture-service";

export const profileRouter = router({
  // Get user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.getUserProfile(ctx.user.id);
    return profile;
  }),

  // Upload profile picture
  uploadProfilePicture: protectedProcedure
    .input(
      z.object({
        fileContent: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await uploadProfilePicture(
          ctx.user.id,
          input.fileContent,
          input.mimeType
        );
        return {
          success: true,
          url: result.url,
          publicId: result.publicId,
        };
      } catch (error) {
        console.error("Profile picture upload error:", error);
        return {
          success: false,
          message: "Failed to upload profile picture",
        };
      }
    }),

  // Update profile picture (delete old, upload new)
  updateProfilePicture: protectedProcedure
    .input(
      z.object({
        fileContent: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getUserProfile(ctx.user.id);
        const oldPublicId = profile?.profilePicturePublicId || null;

        const result = await updateProfilePicture(
          ctx.user.id,
          oldPublicId,
          input.fileContent,
          input.mimeType
        );

        return {
          success: true,
          url: result.url,
          publicId: result.publicId,
        };
      } catch (error) {
        console.error("Profile picture update error:", error);
        return {
          success: false,
          message: "Failed to update profile picture",
        };
      }
    }),

  // Delete profile picture
  deleteProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const profile = await db.getUserProfile(ctx.user.id);

      if (profile?.profilePicturePublicId) {
        await deleteProfilePicture(profile.profilePicturePublicId);
        await db.updateUserProfile(ctx.user.id, {
          profilePictureUrl: null,
          profilePicturePublicId: null,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Profile picture delete error:", error);
      return {
        success: false,
        message: "Failed to delete profile picture",
      };
    }
  }),

  // Get profile picture URL
  getProfilePictureUrl: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const url = await getProfilePicture(input.userId);
      return { url };
    }),

  // Update profile info (username, language, etc.)
  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().optional(),
        preferredLanguage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.updateUserProfile(ctx.user.id, input);
        const updatedProfile = await db.getUserProfile(ctx.user.id);
        return {
          success: true,
          profile: updatedProfile,
        };
      } catch (error) {
        console.error("Profile update error:", error);
        return {
          success: false,
          message: "Failed to update profile",
        };
      }
    }),
});
