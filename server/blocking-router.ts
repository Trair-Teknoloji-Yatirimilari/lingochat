import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const blockingRouter = router({
  /**
   * Block a user
   */
  blockUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      if (input.userId === ctx.user.id) {
        return {
          success: false,
          message: "Cannot block yourself",
        };
      }

      try {
        await db.blockUser(ctx.user.id, input.userId, input.reason);

        return {
          success: true,
          message: "User blocked successfully",
        };
      } catch (error: any) {
        // Check if already blocked
        if (error?.code === "23505") {
          return {
            success: false,
            message: "User is already blocked",
          };
        }

        console.error("Block user error:", error);
        return {
          success: false,
          message: "Failed to block user",
        };
      }
    }),

  /**
   * Unblock a user
   */
  unblockUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      try {
        await db.unblockUser(ctx.user.id, input.userId);

        return {
          success: true,
          message: "User unblocked successfully",
        };
      } catch (error) {
        console.error("Unblock user error:", error);
        return {
          success: false,
          message: "Failed to unblock user",
        };
      }
    }),

  /**
   * Check if a user is blocked
   */
  isBlocked: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { isBlocked: false };
      }

      const isBlocked = await db.isUserBlocked(ctx.user.id, input.userId);

      return { isBlocked };
    }),

  /**
   * Get list of blocked users
   */
  getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return [];
    }

    const blockedUsers = await db.getBlockedUsers(ctx.user.id);

    return blockedUsers;
  }),

  /**
   * Check if two users have blocked each other
   */
  areUsersBlocked: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { areBlocked: false };
      }

      const areBlocked = await db.areUsersBlocked(ctx.user.id, input.userId);

      return { areBlocked };
    }),
});
