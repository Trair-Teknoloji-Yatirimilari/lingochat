import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { markMessageAsRead, getMessageReadStatus } from "./db";

export const readReceiptsRouter = router({
  // Mark a message as read
  markAsRead: publicProcedure
    .input(
      z.object({
        messageId: z.number(),
        conversationId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await markMessageAsRead(input.messageId, input.conversationId, input.userId);
      return { success: true };
    }),

  // Get read status for a message
  getReadStatus: publicProcedure
    .input(z.object({ messageId: z.number() }))
    .query(async ({ input }) => {
      const readStatus = await getMessageReadStatus(input.messageId);
      return {
        messageId: input.messageId,
        readBy: readStatus,
        isRead: readStatus.length > 0,
      };
    }),
});
