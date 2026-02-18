import * as db from "./db";
import { messages } from "@/drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

/**
 * Delete a message for a specific user
 * The message is marked as deleted by the user, but still visible to others
 */
export async function deleteMessageForUser(
  messageId: number,
  userId: number
): Promise<boolean> {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Update the message to mark it as deleted by this user
    await database
      .update(messages)
      .set({
        deletedBy: userId,
        deletedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    return true;
  } catch (error) {
    console.error("[MessageDelete] Delete error:", error);
    throw new Error("Failed to delete message");
  }
}

/**
 * Get message deletion status
 */
export async function getMessageDeletionStatus(messageId: number) {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const result = await database
      .select({
        id: messages.id,
        deletedBy: messages.deletedBy,
        deletedAt: messages.deletedAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId));

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[MessageDelete] Get status error:", error);
    throw new Error("Failed to get message deletion status");
  }
}

/**
 * Check if a message is deleted by a specific user
 */
export async function isMessageDeletedByUser(
  messageId: number,
  userId: number
): Promise<boolean> {
  try {
    const status = await getMessageDeletionStatus(messageId);
    return status?.deletedBy === userId;
  } catch (error) {
    console.error("[MessageDelete] Check deletion error:", error);
    return false;
  }
}

/**
 * Get all deleted messages in a conversation
 */
export async function getDeletedMessagesInConversation(
  conversationId: number
) {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const { and, isNotNull } = await import("drizzle-orm");
    const result = await database
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          isNotNull(messages.deletedBy)
        )
      );

    return result;
  } catch (error) {
    console.error("[MessageDelete] Get deleted messages error:", error);
    throw new Error("Failed to get deleted messages");
  }
}

/**
 * Permanently delete a message (admin only)
 */
export async function permanentlyDeleteMessage(messageId: number): Promise<boolean> {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // In a real app, you might want to keep soft deletes
    // For now, we'll just update the text to "[Deleted]"
    await database
      .update(messages)
      .set({
        originalText: "[Deleted]",
        translatedText: null,
      })
      .where(eq(messages.id, messageId));

    return true;
  } catch (error) {
    console.error("[MessageDelete] Permanent delete error:", error);
    throw new Error("Failed to permanently delete message");
  }
}
