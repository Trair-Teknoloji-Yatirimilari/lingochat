import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  registerPushToken,
  removePushToken,
  sendPushNotification,
} from "./push-notification-service";

export const pushNotificationRouter = router({
  /**
   * Register a push notification token for the current user
   */
  registerToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        platform: z.enum(["ios", "android", "web"]),
        deviceId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return {
          success: false,
          message: "User not authenticated",
        };
      }

      const result = await registerPushToken(
        ctx.user.id,
        input.token,
        input.platform,
        input.deviceId
      );

      if (result.success) {
        return {
          success: true,
          message: "Push token registered successfully",
        };
      }

      return {
        success: false,
        message: "Failed to register push token",
      };
    }),

  /**
   * Remove a push notification token
   */
  removeToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await removePushToken(input.token);

      if (result.success) {
        return {
          success: true,
          message: "Push token removed successfully",
        };
      }

      return {
        success: false,
        message: "Failed to remove push token",
      };
    }),

  /**
   * Test push notification (for development)
   */
  testNotification: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const result = await sendPushNotification({
      userId: ctx.user.id,
      title: "Test Notification",
      body: "This is a test push notification from LingoChat!",
      data: { type: "test" },
    });

    return {
      success: result.success,
      message: result.success
        ? `Notification sent to ${result.sent} device(s)`
        : "Failed to send notification",
    };
  }),
});
