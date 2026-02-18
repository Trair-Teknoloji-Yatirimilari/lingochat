import * as db from "./db";

// Auto-delete scheduler - runs every minute
export function startAutoDeleteScheduler() {
  console.log("[Auto-Delete] Scheduler started");

  // Run immediately on start
  runAutoDelete();

  // Then run every minute
  setInterval(runAutoDelete, 60 * 1000);
}

async function runAutoDelete() {
  try {
    // Get expired messages
    const expiredMessages = await db.getAutoDeleteMessages();
    const expiredGroupMessages = await db.getAutoDeleteGroupMessages();

    if (expiredMessages.length > 0) {
      const messageIds = expiredMessages.map((m) => m.id);
      await db.deleteExpiredMessages(messageIds);
      console.log(`[Auto-Delete] Deleted ${messageIds.length} expired messages`);
    }

    if (expiredGroupMessages.length > 0) {
      const messageIds = expiredGroupMessages.map((m) => m.id);
      await db.deleteExpiredGroupMessages(messageIds);
      console.log(`[Auto-Delete] Deleted ${messageIds.length} expired group messages`);
    }
  } catch (error) {
    console.error("[Auto-Delete] Error:", error);
  }
}
