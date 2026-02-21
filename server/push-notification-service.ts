import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import * as db from "./db";
import { pushTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Create a new Expo SDK client
const expo = new Expo();

export interface SendNotificationParams {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
}

/**
 * Register or update a push token for a user
 */
export async function registerPushToken(
  userId: number,
  token: string,
  platform: "ios" | "android" | "web",
  deviceId?: string
) {
  try {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    // Check if token already exists
    const existingToken = await database
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1);

    if (existingToken.length > 0) {
      // Update existing token
      await database
        .update(pushTokens)
        .set({
          userId,
          platform,
          deviceId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.token, token));
    } else {
      // Insert new token
      await database.insert(pushTokens).values({
        userId,
        token,
        platform,
        deviceId,
        isActive: true,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to register push token:", error);
    return { success: false, error };
  }
}

/**
 * Remove a push token
 */
export async function removePushToken(token: string) {
  try {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    await database
      .update(pushTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pushTokens.token, token));

    return { success: true };
  } catch (error) {
    console.error("Failed to remove push token:", error);
    return { success: false, error };
  }
}

/**
 * Get all active push tokens for a user
 */
export async function getUserPushTokens(userId: number) {
  try {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const tokens = await database
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));

    return tokens.map((t: any) => t.token);
  } catch (error) {
    console.error("Failed to get user push tokens:", error);
    return [];
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(params: SendNotificationParams) {
  const { userId, title, body, data, sound = "default", badge } = params;

  try {
    // Get user's push tokens
    const tokens = await getUserPushTokens(userId);

    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { success: true, sent: 0 };
    }

    // Filter valid Expo push tokens
    const validTokens = tokens.filter((token: string) =>
      Expo.isExpoPushToken(token)
    );

    if (validTokens.length === 0) {
      console.log(`No valid Expo push tokens for user ${userId}`);
      return { success: true, sent: 0 };
    }

    // Create messages
    const messages: ExpoPushMessage[] = validTokens.map((token: string) => ({
      to: token,
      sound: sound || undefined,
      title,
      body,
      data: data || {},
      badge: badge || undefined,
      priority: "high",
    }));

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    // Check for errors in tickets
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === "error") {
        console.error(
          `Error sending notification to ${validTokens[i]}:`,
          ticket.message
        );

        // If token is invalid, mark it as inactive
        if (
          ticket.details?.error === "DeviceNotRegistered" ||
          ticket.details?.error === "InvalidCredentials"
        ) {
          await removePushToken(validTokens[i]);
        }
      }
    }

    return { success: true, sent: validTokens.length, tickets };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: number[],
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const results = await Promise.all(
    userIds.map((userId) =>
      sendPushNotification({ userId, title, body, data })
    )
  );

  const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);

  return { success: true, sent: totalSent };
}
