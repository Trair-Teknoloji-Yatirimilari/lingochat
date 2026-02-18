import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { sendOTP, verifyOTP, resendOTP } from "./otp-service";
import { readReceiptsRouter } from "./read-receipts-router";
import { profileRouter } from "./profile-router";
import { groupRouter } from "./group-router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    sendOtp: publicProcedure
      .input(z.object({
        phoneNumber: z.string().min(10).max(20),
      }))
      .mutation(async ({ input }) => {
        try {
          const otp = await sendOTP(input.phoneNumber);
          return {
            success: true,
            message: "OTP sent successfully",
            otp: process.env.NODE_ENV === "development" ? otp : undefined,
          };
        } catch (error) {
          console.error("Error sending OTP:", error);
          return {
            success: false,
            message: "Failed to send OTP",
          };
        }
      }),
    verifyOtp: publicProcedure
      .input(z.object({
        phoneNumber: z.string().min(10).max(20),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await verifyOTP(input.phoneNumber, input.code);
          if (result.success && result.userId) {
            // Get the user from database to create proper session
            const user = await db.getUserById(result.userId);
            if (!user) {
              return {
                success: false,
                message: "User not found",
              };
            }

            // Import sdk to create session token
            const { sdk } = await import("./_core/sdk");
            
            // Create a proper JWT session token
            const sessionToken = await sdk.createSessionToken(user.openId, {
              name: user.name || input.phoneNumber,
            });

            // Set the session cookie with JWT token
            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
            
            console.log("[Auth] Session cookie set for user:", user.id, "openId:", user.openId);

            // Check if user has completed profile setup
            const profile = await db.getUserProfile(result.userId);
            const hasCompletedProfile = profile && 
              profile.username && 
              !profile.username.startsWith("user_") && 
              profile.username.length >= 3;

            console.log("[Auth] Profile check:", {
              userId: result.userId,
              username: profile?.username,
              hasCompletedProfile,
            });

            return {
              success: true,
              message: "OTP verified successfully",
              userId: result.userId,
              sessionToken, // Return token for React Native to store
              hasCompletedProfile, // Indicate if user needs to complete profile
            };
          }
          return {
            success: false,
            message: result.message,
          };
        } catch (error) {
          console.error("Error verifying OTP:", error);
          return {
            success: false,
            message: "Failed to verify OTP",
          };
        }
      }),
    resendOtp: publicProcedure
      .input(z.object({
        phoneNumber: z.string().min(10).max(20),
      }))
      .mutation(async ({ input }) => {
        try {
          const otp = await resendOTP(input.phoneNumber);
          return {
            success: true,
            message: "OTP resent successfully",
            otp: process.env.NODE_ENV === "development" ? otp : undefined,
          };
        } catch (error) {
          console.error("Error resending OTP:", error);
          return {
            success: false,
            message: "Failed to resend OTP",
          };
        }
      }),
  }),

  // User profile routes
  profile: router({
    create: protectedProcedure
      .input(z.object({
        username: z.string().min(3).max(20),
        preferredLanguage: z.string().min(2).max(10).default("tr"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createUserProfile({
          userId: ctx.user.id,
          username: input.username,
          preferredLanguage: input.preferredLanguage,
        });
      }),

    checkUsername: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(20),
      }))
      .query(async ({ input }) => {
        try {
          const existing = await db.findUserByUsername(input.username);
          return {
            available: !existing,
            suggestions: existing ? [
              `${input.username}${Math.floor(Math.random() * 100)}`,
              `${input.username}_${Math.floor(Math.random() * 1000)}`,
              `${input.username}${new Date().getFullYear()}`,
            ] : [],
          };
        } catch (error) {
          return { available: true, suggestions: [] };
        }
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        username: z.string().min(3).max(20).optional(),
        preferredLanguage: z.string().min(2).max(10).optional(),
        showReadReceipts: z.boolean().optional(),
        showOnlineStatus: z.boolean().optional(),
        showProfilePhoto: z.boolean().optional(),
        autoDeleteDuration: z.number().nullable().optional(), // null = disabled, 0 = immediate, 21600 = 6h, 43200 = 12h, 86400 = 24h
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        // Delete profile picture from storage if exists
        const profile = await db.getUserProfile(ctx.user.id);
        if (profile?.profilePicturePublicId) {
          try {
            const { deleteProfilePicture } = await import("./profile-picture-service");
            await deleteProfilePicture(profile.profilePicturePublicId);
          } catch (error) {
            console.error("Failed to delete profile picture:", error);
          }
        }

        // Delete all user data from database
        await db.deleteUserAccount(ctx.user.id);

        // Clear session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

        return { success: true, message: "Hesabınız başarıyla silindi" };
      } catch (error) {
        console.error("Account deletion error:", error);
        return { success: false, message: "Hesap silinirken bir hata oluştu" };
      }
    }),

    uploadProfilePicture: protectedProcedure
      .input(z.object({
        fileContent: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { uploadProfilePicture } = await import("./profile-picture-service");
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

    updateProfilePicture: protectedProcedure
      .input(z.object({
        fileContent: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { updateProfilePicture } = await import("./profile-picture-service");
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

    deleteProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const { deleteProfilePicture } = await import("./profile-picture-service");
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
  }),

  // Chat routes
  chat: router({
    create: protectedProcedure
      .input(z.object({
        participantIdentifier: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const participant = await db.findUserByIdentifier(input.participantIdentifier);
        if (!participant) {
          throw new Error("User not found");
        }
        return db.createConversation({
          participant1Id: ctx.user.id,
          participant2Id: participant.id,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getConversation(input.id);
      }),

    sendInvite: protectedProcedure
      .input(z.object({
        contactName: z.string(),
        contactInfo: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return {
          success: true,
          message: `Invitation sent to ${input.contactName}`,
        };
      }),
  }),

  // Conversation routes
  conversations: router({
    create: protectedProcedure
      .input(z.object({
        participantId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createConversation({
          participant1Id: ctx.user.id,
          participant2Id: input.participantId,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getConversation(input.id);
      }),
  }),

  // Message routes
  messages: router({
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        text: z.string().min(1),
        recipientLanguage: z.string().min(2).max(10),
      }))
      .mutation(async ({ ctx, input }) => {
        const senderProfile = await db.getUserProfile(ctx.user.id);
        const senderLanguage = senderProfile?.preferredLanguage || "tr";

        // Get conversation to find recipient
        const conversation = await db.getConversation(input.conversationId);
        if (!conversation) {
          throw new Error("Conversation not found");
        }

        const recipientId =
          conversation.participant1Id === ctx.user.id
            ? conversation.participant2Id
            : conversation.participant1Id;

        const recipientProfile = await db.getUserProfile(recipientId);

        // Calculate auto-delete time based on sender's settings
        const autoDeleteDuration = senderProfile?.autoDeleteDuration;
        const autoDeleteAt = db.calculateAutoDeleteTime(autoDeleteDuration);

        const message = await db.createMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          originalText: input.text,
          senderLanguage,
          recipientLanguage: input.recipientLanguage,
          isTranslated: false,
          autoDeleteAt,
        });

        if (senderLanguage !== input.recipientLanguage) {
          try {
            const translationResponse = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `You are a professional translator. Translate the following text from ${senderLanguage} to ${input.recipientLanguage}. Return ONLY the translated text, nothing else.`,
                },
                {
                  role: "user",
                  content: input.text,
                },
              ],
            });

            const content = translationResponse.choices[0]?.message?.content;
            const translatedText = typeof content === 'string' ? content : input.text;

            await db.updateMessage(message.id, {
              translatedText,
              isTranslated: true,
            });

            return {
              ...message,
              translatedText,
              isTranslated: true,
            };
          } catch (error) {
            console.error("Translation error:", error);
            return message;
          }
        }

        return message;
      }),

    list: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const messages = await db.getConversationMessages(input.conversationId, input.limit);
        
        // Get media for all messages
        const messageIds = messages.map((m) => m.id);
        const mediaMessages = await Promise.all(
          messageIds.map((id) => db.getMediaMessageByMessageId(id))
        );
        const mediaMap = new Map(
          mediaMessages.filter((m) => m).map((m) => [m!.messageId, m])
        );

        // Attach media to messages
        return messages.map((msg) => ({
          ...msg,
          media: mediaMap.get(msg.id) || null,
        }));
      }),

    delete: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { deleteMessageForUser } = await import("./message-delete-service");
          const result = await deleteMessageForUser(input.messageId, ctx.user.id);
          return { success: result };
        } catch (error) {
          console.error("Message delete error:", error);
          return { success: false, message: "Failed to delete message" };
        }
      }),

    sendMedia: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          mediaType: z.enum(["image", "document", "location", "contact"]),
          mediaData: z.any(),
          caption: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          let mediaUrl: string | null = null;
          let cloudinaryPublicId: string | null = null;
          let fileName: string | null = null;
          let fileSize: number | null = null;
          let mimeType: string | null = null;

          // Handle image/document upload
          if (input.mediaType === "image" || input.mediaType === "document") {
            const { v2: cloudinary } = await import("cloudinary");

            cloudinary.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            const uploadResult = await cloudinary.uploader.upload(
              input.mediaData.uri || input.mediaData.fileContent,
              {
                folder: "lingo-chat/chat-media",
                resource_type: "auto",
                public_id: `${input.conversationId}-${Date.now()}`,
              }
            );

            mediaUrl = uploadResult.secure_url;
            cloudinaryPublicId = uploadResult.public_id;
            fileName = input.mediaData.name || input.mediaData.fileName;
            fileSize = input.mediaData.size || input.mediaData.fileSize;
            mimeType = input.mediaData.mimeType;
          }

          // Create text message
          const senderProfile = await db.getUserProfile(ctx.user.id);
          const senderLanguage = senderProfile?.preferredLanguage || "tr";

          const messageText =
            input.caption ||
            (input.mediaType === "image"
              ? ""
              : input.mediaType === "document"
              ? `[Belge: ${fileName}]`
              : input.mediaType === "location"
              ? "[Konum]"
              : "");

          const message = await db.createMessage({
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            originalText: messageText,
            senderLanguage,
            recipientLanguage: senderLanguage,
            isTranslated: false,
          });

          // Create media message
          const mediaData: any = {
            messageId: message.id,
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            mediaType: input.mediaType,
            mediaUrl,
            cloudinaryPublicId,
            fileName,
            fileSize,
            mimeType,
            caption: input.caption,
          };

          // Add location/contact specific fields
          if (input.mediaType === "location") {
            mediaData.latitude = input.mediaData.latitude;
            mediaData.longitude = input.mediaData.longitude;
            mediaData.address = input.mediaData.address;
          } else if (input.mediaType === "contact") {
            mediaData.contactName = input.mediaData.name;
            mediaData.contactPhone = input.mediaData.phoneNumbers?.[0]?.number;
          }

          const mediaMessage = await db.createMediaMessage(mediaData);

          return {
            success: true,
            message,
            mediaMessage,
          };
        } catch (error) {
          console.error("Media upload error:", error);
          return {
            success: false,
            message: "Medya yüklenemedi",
          };
        }
      }),
  }),

  // Media upload routes
  media: router({
    upload: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        mediaType: z.enum(['image', 'video', 'file']),
        fileContent: z.string(), // base64 encoded
        caption: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { v2: cloudinary } = await import('cloudinary');
          
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });

          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(
            `data:${input.mimeType};base64,${input.fileContent}`,
            {
              folder: 'lingo-chat',
              resource_type: input.mediaType === 'video' ? 'video' : 'auto',
              public_id: `${input.conversationId}-${Date.now()}`,
            }
          );

          // Create message first
          const message = await db.createMessage({
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            originalText: input.caption || `[${input.mediaType.toUpperCase()}]`,
            senderLanguage: 'auto',
            recipientLanguage: 'auto',
            isTranslated: false,
          });

          // Store media metadata
          const mediaMessage = await db.createMediaMessage({
            messageId: message.id,
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            mediaType: input.mediaType,
            mediaUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            caption: input.caption,
          });

          return {
            messageId: message.id,
            mediaUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
          };
        } catch (error) {
          console.error('Media upload error:', error);
          throw new Error('Failed to upload media');
        }
       }),
  }),

  // Read receipts routes
  readReceipts: readReceiptsRouter,

  // Group routes
  groups: groupRouter,
});
export type AppRouter = typeof appRouter;
