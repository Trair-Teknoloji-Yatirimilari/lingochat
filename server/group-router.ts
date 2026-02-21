import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// Generate unique 6-character room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const groupRouter = router({
  // Create a new group room
  createRoom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(255),
        description: z.string().max(500).optional(),
        maxParticipants: z.number().min(2).max(100).default(50),
        autoDeleteDuration: z.number().nullable().optional(), // Auto-delete setting
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique room code
      let roomCode = generateRoomCode();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure code is unique
      while (attempts < maxAttempts) {
        const existing = await db.getRoomByCode(roomCode);
        if (!existing) break;
        roomCode = generateRoomCode();
        attempts++;
      }

      if (attempts === maxAttempts) {
        throw new Error("Failed to generate unique room code");
      }

      // Create room
      const room = await db.createGroupRoom({
        name: input.name,
        description: input.description,
        creatorId: ctx.user.id,
        roomCode,
        maxParticipants: input.maxParticipants,
        autoDeleteDuration: input.autoDeleteDuration,
      });

      // Add creator as moderator
      await db.addGroupParticipant({
        roomId: room.id,
        userId: ctx.user.id,
        isModerator: true,
      });

      return {
        success: true,
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          roomCode: room.roomCode,
          maxParticipants: room.maxParticipants,
          createdAt: room.createdAt,
        },
      };
    }),

  // Join room with code
  joinRoom: protectedProcedure
    .input(
      z.object({
        roomCode: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await db.getRoomByCode(input.roomCode);

      if (!room) {
        return {
          success: false,
          message: "Oda bulunamadı",
        };
      }

      if (!room.isActive) {
        return {
          success: false,
          message: "Bu oda artık aktif değil",
        };
      }

      // Check if already a participant
      const existingParticipant = await db.getGroupParticipant(room.id, ctx.user.id);
      if (existingParticipant && !existingParticipant.leftAt) {
        return {
          success: true,
          message: "Zaten bu odadasınız",
          room: {
            id: room.id,
            name: room.name,
            description: room.description,
            roomCode: room.roomCode,
            maxParticipants: room.maxParticipants,
          },
        };
      }

      // Check room capacity
      const activeParticipants = await db.getActiveParticipantsCount(room.id);
      if (activeParticipants >= room.maxParticipants) {
        return {
          success: false,
          message: "Oda dolu",
        };
      }

      // Add participant
      await db.addGroupParticipant({
        roomId: room.id,
        userId: ctx.user.id,
        isModerator: false,
      });

      return {
        success: true,
        message: "Odaya katıldınız",
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          roomCode: room.roomCode,
          maxParticipants: room.maxParticipants,
        },
      };
    }),

  // Get user's active rooms
  getMyRooms: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserActiveRooms(ctx.user.id);
  }),

  // Get all active rooms
  getActiveRooms: protectedProcedure.query(async () => {
    return db.getActiveRooms();
  }),

  // Get room details
  getRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      return db.getGroupRoom(input.roomId);
    }),

  // Leave room
  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.leaveGroupRoom(input.roomId, ctx.user.id);
      return { success: true };
    }),

  // Send message to room
  sendMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        text: z.string().min(1),
        replyToMessageId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const senderProfile = await db.getUserProfile(ctx.user.id);
      const senderLanguage = senderProfile?.preferredLanguage || "tr";

      // Get room to check auto-delete settings
      const room = await db.getGroupRoom(input.roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Calculate auto-delete time
      // Premium rooms don't auto-delete
      let autoDeleteAt = null;
      if (!room.isPremium) {
        const autoDeleteDuration = room.autoDeleteDuration ?? senderProfile?.autoDeleteDuration;
        autoDeleteAt = db.calculateAutoDeleteTime(autoDeleteDuration);
      }

      // Create message
      const message = await db.createGroupMessage({
        roomId: input.roomId,
        senderId: ctx.user.id,
        originalText: input.text,
        originalLanguage: senderLanguage,
        autoDeleteAt,
      });

      // Send push notifications to other participants
      try {
        const { sendPushNotificationToUsers } = await import("./push-notification-service");
        const participants = await db.getGroupParticipants(input.roomId);
        const otherParticipantIds = participants
          .filter((p) => p.userId !== ctx.user.id && !p.leftAt)
          .map((p) => p.userId);

        if (otherParticipantIds.length > 0) {
          await sendPushNotificationToUsers(
            otherParticipantIds,
            room.name,
            `${senderProfile?.username || "Someone"}: ${input.text.substring(0, 100)}`,
            {
              type: "group_message",
              roomId: input.roomId,
              messageId: message.id,
            }
          );
        }
      } catch (error) {
        console.error("Failed to send push notifications:", error);
        // Don't fail the message send if push notification fails
      }

      return {
        success: true,
        message: {
          id: message.id,
          roomId: message.roomId,
          senderId: message.senderId,
          originalText: message.originalText,
          originalLanguage: message.originalLanguage,
          createdAt: message.createdAt,
        },
      };
    }),

  // Get room messages (with translation)
  getMessages: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userProfile = await db.getUserProfile(ctx.user.id);
      const userLanguage = userProfile?.preferredLanguage || "tr";

      console.log("[GroupMessages] User:", ctx.user.id, "Language:", userLanguage);

      const messages = await db.getGroupMessages(input.roomId, input.limit);

      // Get sender profiles for all messages
      const senderIds = [...new Set(messages.map((m) => m.senderId))];
      const senderProfiles = await Promise.all(
        senderIds.map((id) => db.getUserProfile(id))
      );
      const profileMap = new Map(
        senderProfiles.filter((p) => p).map((p) => [p!.userId, p])
      );

      // Get media for all messages
      const messageIds = messages.map((m) => m.id);
      const mediaMessages = await Promise.all(
        messageIds.map((id) => db.getMediaMessageByMessageId(id))
      );
      const mediaMap = new Map(
        mediaMessages.filter((m) => m).map((m) => [m!.messageId, m])
      );

      // Translate messages to user's language
      const translatedMessages = await Promise.all(
        messages.map(async (msg) => {
          const senderProfile = profileMap.get(msg.senderId);
          const mediaData = mediaMap.get(msg.id);

          // If message is very recent (< 2 seconds old), skip translation for speed
          const messageAge = Date.now() - new Date(msg.createdAt).getTime();
          const isVeryRecent = messageAge < 2000;

          // If message is in user's language or very recent, no translation needed
          if (msg.originalLanguage === userLanguage || isVeryRecent) {
            return {
              ...msg,
              translatedText: msg.originalText,
              targetLanguage: userLanguage,
              senderUsername: senderProfile?.username,
              senderProfilePicture: senderProfile?.profilePictureUrl,
              media: mediaData || null,
            };
          }

          // Check if translation exists in cache
          const cachedTranslation = await db.getGroupMessageTranslation(
            msg.id,
            userLanguage
          );

          if (cachedTranslation) {
            return {
              ...msg,
              translatedText: cachedTranslation.translatedText,
              targetLanguage: userLanguage,
              senderUsername: senderProfile?.username,
              senderProfilePicture: senderProfile?.profilePictureUrl,
              media: mediaData || null,
            };
          }

          // Translate and cache
          try {
            const translationResponse = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `You are a professional translator. Translate the following text from ${msg.originalLanguage} to ${userLanguage}. Return ONLY the translated text, nothing else.`,
                },
                {
                  role: "user",
                  content: msg.originalText,
                },
              ],
            });

            const content = translationResponse.choices[0]?.message?.content;
            const translatedText =
              typeof content === "string" ? content : msg.originalText;

            // Cache translation
            await db.createGroupMessageTranslation({
              messageId: msg.id,
              targetLanguage: userLanguage,
              translatedText,
            });

            return {
              ...msg,
              translatedText,
              targetLanguage: userLanguage,
              senderUsername: senderProfile?.username,
              senderProfilePicture: senderProfile?.profilePictureUrl,
              media: mediaData || null,
            };
          } catch (error) {
            console.error("Translation error:", error);
            return {
              ...msg,
              translatedText: msg.originalText,
              targetLanguage: userLanguage,
              senderUsername: senderProfile?.username,
              senderProfilePicture: senderProfile?.profilePictureUrl,
              media: mediaData || null,
            };
          }
        })
      );

      return translatedMessages;
    }),

  // Get room participants
  getParticipants: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      return db.getGroupParticipants(input.roomId);
    }),

  // Invite users to room
  inviteUsers: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        userIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await db.getGroupRoom(input.roomId);
      
      if (!room) {
        return { success: false, message: "Oda bulunamadı" };
      }

      if (!room.isActive) {
        return { success: false, message: "Bu oda artık aktif değil" };
      }

      // Check if user is a participant (only participants can invite)
      const userParticipant = await db.getGroupParticipant(input.roomId, ctx.user.id);
      if (!userParticipant || userParticipant.leftAt) {
        return { success: false, message: "Bu odaya davet gönderemezsiniz" };
      }

      const results = [];
      for (const userId of input.userIds) {
        // Check if already a participant
        const existing = await db.getGroupParticipant(input.roomId, userId);
        if (existing && !existing.leftAt) {
          results.push({ userId, success: false, message: "Zaten odada" });
          continue;
        }

        // Check room capacity
        const activeCount = await db.getActiveParticipantsCount(input.roomId);
        if (activeCount >= room.maxParticipants) {
          results.push({ userId, success: false, message: "Oda dolu" });
          continue;
        }

        // Add participant
        try {
          await db.addGroupParticipant({
            roomId: input.roomId,
            userId,
            isModerator: false,
          });
          results.push({ userId, success: true, message: "Davet gönderildi" });
        } catch (error) {
          results.push({ userId, success: false, message: "Hata oluştu" });
        }
      }

      return {
        success: true,
        results,
        invited: results.filter((r) => r.success).length,
      };
    }),

  // Search users by phone or username
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return db.searchUsersByPhoneOrUsername(input.query);
    }),

  // Send media message to room
  sendMediaMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
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
        let latitude: string | null = null;
        let longitude: string | null = null;
        let address: string | null = null;
        let contactName: string | null = null;
        let contactPhone: string | null = null;

        // Handle different media types
        if (input.mediaType === "image" || input.mediaType === "document") {
          // Check Cloudinary configuration
          if (!process.env.CLOUDINARY_CLOUD_NAME || 
              !process.env.CLOUDINARY_API_KEY || 
              !process.env.CLOUDINARY_API_SECRET) {
            console.error('[Media Upload] Cloudinary not configured properly');
            return {
              success: false,
              message: "Medya yükleme servisi yapılandırılmamış. Lütfen yönetici ile iletişime geçin.",
            };
          }

          // Upload to Cloudinary
          const { v2: cloudinary } = await import("cloudinary");

          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });

          // Handle base64 data or file URI
          let uploadData = input.mediaData.uri || input.mediaData.fileContent;
          
          // If it's a file URI (starts with file://), we need to read it as base64
          if (uploadData && uploadData.startsWith('file://')) {
            // For React Native, we expect the frontend to send base64 data
            // If we receive a file URI, it means the frontend didn't convert it
            console.error('[Media Upload] Received file URI instead of base64:', uploadData);
            return {
              success: false,
              message: "Fotoğraf yüklenemedi. Lütfen tekrar deneyin.",
            };
          }

          const uploadResult = await cloudinary.uploader.upload(
            uploadData,
            {
              folder: "lingo-chat/group-media",
              resource_type: "auto",
              public_id: `${input.roomId}-${Date.now()}`,
            }
          );

          mediaUrl = uploadResult.secure_url;
          cloudinaryPublicId = uploadResult.public_id;
          fileName = input.mediaData.name || input.mediaData.fileName;
          fileSize = input.mediaData.size || input.mediaData.fileSize;
          mimeType = input.mediaData.mimeType;
        } else if (input.mediaType === "location") {
          latitude = input.mediaData.latitude?.toString();
          longitude = input.mediaData.longitude?.toString();
          address = input.mediaData.address;
        } else if (input.mediaType === "contact") {
          contactName = input.mediaData.name;
          contactPhone = input.mediaData.phoneNumbers?.[0]?.number;
        }

        // Create text message first
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

        const message = await db.createGroupMessage({
          roomId: input.roomId,
          senderId: ctx.user.id,
          originalText: messageText,
          originalLanguage: senderLanguage,
        });

        // Create media message
        const mediaMessage = await db.createGroupMediaMessage({
          messageId: message.id,
          roomId: input.roomId,
          senderId: ctx.user.id,
          mediaType: input.mediaType,
          mediaUrl,
          cloudinaryPublicId,
          fileName,
          fileSize,
          mimeType,
          latitude,
          longitude,
          address,
          contactName,
          contactPhone,
          caption: input.caption,
        });

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

  // Generate meeting summary
  generateSummary: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get room details
        const room = await db.getGroupRoom(input.roomId);
        if (!room) {
          return { success: false, message: "Oda bulunamadı" };
        }

        // Check if user is a participant
        const participant = await db.getGroupParticipant(input.roomId, ctx.user.id);
        if (!participant || participant.leftAt) {
          return { success: false, message: "Bu odanın katılımcısı değilsiniz" };
        }

        // Get all messages
        const messages = await db.getGroupMessages(input.roomId, 1000);
        if (messages.length === 0) {
          return { success: false, message: "Özetlenecek mesaj bulunamadı" };
        }

        // Get participants
        const participants = await db.getGroupParticipants(input.roomId);
        const activeParticipants = participants; // Already filtered by leftAt in getGroupParticipants

        // Get sender profiles for all messages
        const senderIds = [...new Set(messages.map((m) => m.senderId))];
        const senderProfiles = await Promise.all(
          senderIds.map((id) => db.getUserProfile(id))
        );
        const profileMap = new Map(
          senderProfiles.filter((p) => p).map((p) => [p!.userId, p])
        );

        // Prepare messages for AI
        const messagesForAI = messages.map((msg) => {
          const profile = profileMap.get(msg.senderId);
          return {
            username: profile?.username || `User ${msg.senderId}`,
            text: msg.originalText,
            language: msg.originalLanguage,
            time: msg.createdAt,
          };
        });

        // Create AI prompt
        const prompt = `Sen bir toplantı asistanısın. Aşağıdaki grup sohbet mesajlarını analiz edip detaylı bir özet çıkar.

Toplantı Bilgileri:
- Oda Adı: ${room.name}
- Mesaj Sayısı: ${messages.length}
- Katılımcı Sayısı: ${activeParticipants.length}
- Başlangıç: ${messages[0].createdAt}
- Bitiş: ${messages[messages.length - 1].createdAt}

Mesajlar:
${messagesForAI.map((m) => `[${m.time.toLocaleTimeString("tr-TR")}] ${m.username} (${m.language}): ${m.text}`).join("\n")}

Lütfen aşağıdaki formatta bir özet oluştur (JSON formatında):

{
  "mainTopics": ["Konu 1", "Konu 2", "Konu 3"],
  "decisions": ["Karar 1", "Karar 2"],
  "actionItems": [
    {"assignee": "@username", "task": "Görev açıklaması", "deadline": "Tarih (varsa)"}
  ],
  "highlights": ["Önemli nokta 1", "Önemli nokta 2"],
  "participantStats": {
    "username1": {"messageCount": 10, "percentage": 20},
    "username2": {"messageCount": 15, "percentage": 30}
  },
  "languageDistribution": {
    "tr": 60,
    "en": 30,
    "fr": 10
  },
  "conclusion": "Toplantı özeti ve sonuç"
}

SADECE JSON döndür, başka açıklama ekleme.`;

        // Call LLM
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Sen bir toplantı asistanısın. Grup sohbet mesajlarını analiz edip özet çıkarırsın. Sadece JSON formatında yanıt verirsin.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          return { success: false, message: "Özet oluşturulamadı" };
        }

        // Parse JSON response
        let summaryData;
        try {
          // Remove markdown code blocks if present
          const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          summaryData = JSON.parse(cleanContent);
        } catch (error) {
          console.error("JSON parse error:", error);
          return { success: false, message: "Özet formatı hatalı" };
        }

        // Save summary to database
        const summary = await db.createMeetingSummary({
          roomId: input.roomId,
          generatedBy: ctx.user.id,
          messageCount: messages.length,
          participantCount: activeParticipants.length,
          startTime: messages[0].createdAt,
          endTime: messages[messages.length - 1].createdAt,
          summaryData: JSON.stringify(summaryData),
        });

        return {
          success: true,
          summary: {
            id: summary.id,
            ...summaryData,
            messageCount: messages.length,
            participantCount: activeParticipants.length,
            startTime: messages[0].createdAt,
            endTime: messages[messages.length - 1].createdAt,
            createdAt: summary.createdAt,
          },
        };
      } catch (error) {
        console.error("Generate summary error:", error);
        return { success: false, message: "Özet oluşturulurken hata oluştu" };
      }
    }),

  // Get meeting summaries for a room
  getSummaries: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const summaries = await db.getMeetingSummaries(input.roomId, 10);
      return summaries.map((s) => ({
        id: s.id,
        roomId: s.roomId,
        generatedBy: s.generatedBy,
        messageCount: s.messageCount,
        participantCount: s.participantCount,
        startTime: s.startTime,
        endTime: s.endTime,
        summaryData: JSON.parse(s.summaryData),
        createdAt: s.createdAt,
      }));
    }),

  // Get single meeting summary
  getSummary: protectedProcedure
    .input(z.object({ summaryId: z.number() }))
    .query(async ({ input }) => {
      const summary = await db.getMeetingSummary(input.summaryId);
      if (!summary) return null;
      
      return {
        id: summary.id,
        roomId: summary.roomId,
        generatedBy: summary.generatedBy,
        messageCount: summary.messageCount,
        participantCount: summary.participantCount,
        startTime: summary.startTime,
        endTime: summary.endTime,
        summaryData: JSON.parse(summary.summaryData),
        createdAt: summary.createdAt,
      };
    }),

  // Generate AI summary for media (document/image)
  generateMediaSummary: protectedProcedure
    .input(
      z.object({
        mediaUrl: z.string(),
        mediaType: z.enum(["image", "document"]),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let prompt = "";
        
        if (input.mediaType === "image") {
          prompt = `Bir kullanıcı "${input.fileName || 'bir görsel'}" adlı bir fotoğraf paylaştı. Bu fotoğraf hakkında genel bir açıklama yap. Fotoğrafın ne amaçla paylaşılmış olabileceğini, muhtemel içeriğini ve önemini kısa ve öz bir şekilde Türkçe olarak açıkla. Maksimum 3-4 cümle kullan.`;
        } else if (input.mediaType === "document") {
          const fileExt = input.fileName?.split('.').pop()?.toLowerCase() || '';
          let docType = "belge";
          if (fileExt === "pdf") docType = "PDF belgesi";
          else if (["doc", "docx"].includes(fileExt)) docType = "Word belgesi";
          else if (["xls", "xlsx"].includes(fileExt)) docType = "Excel dosyası";
          else if (["ppt", "pptx"].includes(fileExt)) docType = "PowerPoint sunumu";
          else if (["txt"].includes(fileExt)) docType = "metin dosyası";
          
          prompt = `Bir kullanıcı "${input.fileName || 'bir belge'}" adlı bir ${docType} paylaştı. Bu belgenin muhtemel içeriğini, ne amaçla paylaşılmış olabileceğini ve önemini kısa ve öz bir şekilde Türkçe olarak açıkla. Dosya adından ve türünden yola çıkarak genel bir özet oluştur. Maksimum 3-4 cümle kullan.`;
        }

        // Call LLM for summary
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Sen yardımcı bir AI asistanısın. Paylaşılan medya dosyaları hakkında kısa ve öz açıklamalar yapıyorsun.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const summary = (typeof response.choices[0]?.message?.content === "string" 
          ? response.choices[0]?.message?.content 
          : JSON.stringify(response.choices[0]?.message?.content)) || "Özet oluşturulamadı.";

        return {
          success: true,
          summary,
          mediaType: input.mediaType,
          fileName: input.fileName,
        };
      } catch (error) {
        console.error("Generate media summary error:", error);
        return {
          success: false,
          message: "Medya özeti oluşturulurken hata oluştu",
          summary: "",
        };
      }
    }),
});
