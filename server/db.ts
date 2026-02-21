import { eq, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, 
  users, 
  userProfiles, 
  conversations, 
  messages, 
  mediaMessages, 
  readReceipts, 
  phoneVerifications,
  otpCodes,
  blockedUsers,
  InsertUserProfile, 
  InsertConversation, 
  InsertMessage, 
  InsertMediaMessage, 
  InsertReadReceipt 
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using ON CONFLICT
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User Profile queries
export async function createUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userProfiles).values(data).returning();
  return result[0];
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function findUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
}

// Conversation queries
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data).returning();
  return result[0];
}

export async function getConversation(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(conversations)
    .where(
      and(
        or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
        or(
          and(eq(conversations.participant1Id, userId), eq(conversations.deletedByUser1, false)),
          and(eq(conversations.participant2Id, userId), eq(conversations.deletedByUser2, false))
        )
      )
    );
  return result;
}

export async function deleteConversationForUser(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get conversation to determine which user is deleting
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  
  // Soft delete: mark as deleted for this user
  if (conversation.participant1Id === userId) {
    await db.update(conversations)
      .set({ deletedByUser1: true })
      .where(eq(conversations.id, conversationId));
  } else if (conversation.participant2Id === userId) {
    await db.update(conversations)
      .set({ deletedByUser2: true })
      .where(eq(conversations.id, conversationId));
  } else {
    throw new Error("User is not a participant in this conversation");
  }
  
  return true;
}

// Message queries
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data).returning();
  return result[0];
}

export async function getConversationMessages(conversationId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy((m) => m.createdAt)
    .limit(limit);
  return result;
}

export async function updateMessage(id: number, data: Partial<InsertMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages).set(data).where(eq(messages.id, id));
}

export async function findMessageByClientId(clientMessageId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(messages)
    .where(eq(messages.clientMessageId, clientMessageId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function findGroupMessageByClientId(clientMessageId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { groupMessages } = await import("../drizzle/schema");
  const result = await db.select().from(groupMessages)
    .where(eq(groupMessages.clientMessageId, clientMessageId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Find user by phone or email
export async function findUserByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users)
    .where(or(eq(users.email, identifier)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Find users by phone numbers (for contact sync)
export async function findUsersByPhoneNumbers(phoneNumbers: string[]) {
  const db = await getDb();
  if (!db) return [];
  
  // Clean phone numbers (remove spaces, dashes, etc.)
  const cleanNumbers = phoneNumbers.map(num => num.replace(/[^\d+]/g, ''));
  
  const result = await db.select({
    userId: users.id,
    phoneNumber: userProfiles.phoneNumber,
    username: userProfiles.username,
    profilePictureUrl: userProfiles.profilePictureUrl,
  })
  .from(userProfiles)
  .innerJoin(users, eq(users.id, userProfiles.userId))
  .where(
    or(...cleanNumbers.map(num => eq(userProfiles.phoneNumber, num)))
  );
  
  return result;
}

// Media message functions
export async function createMediaMessage(data: InsertMediaMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mediaMessages).values(data).returning();
  return result[0];
}

export async function getConversationMediaMessages(conversationId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(mediaMessages)
    .where(eq(mediaMessages.conversationId, conversationId))
    .orderBy((m) => m.createdAt)
    .limit(limit);
  return result;
}



// Read Receipts - Mark message as read
export async function markMessageAsRead(
  messageId: number,
  conversationId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select()
      .from(readReceipts)
      .where(
        (rc) => or(eq(rc.messageId, messageId), eq(rc.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(readReceipts).values({
        messageId,
        conversationId,
        userId,
      });
    }
  } catch (error) {
    console.error("[DB] Error marking message as read:", error);
  }
}

// Read Receipts - Get who read a message
export async function getMessageReadStatus(
  messageId: number
): Promise<{ userId: number; readAt: Date }[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select({
        userId: readReceipts.userId,
        readAt: readReceipts.readAt,
        messageId: readReceipts.messageId,
      })
      .from(readReceipts)
      .where((rc) => eq(rc.messageId, messageId));
  } catch (error) {
    console.error("[DB] Error getting read status:", error);
    return [];
  }
}

// Delete user account and all related data
export async function deleteUserAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log(`[Database] Starting account deletion for user: ${userId}`);
    
    // Get user profile to find phone number for OTP cleanup
    const profile = await getUserProfile(userId);
    const phoneNumber = profile?.phoneNumber;
    
    // Delete in order: child tables first, then parent tables
    // 1. Delete read receipts
    const readReceiptsDeleted = await db.delete(readReceipts).where(eq(readReceipts.userId, userId));
    console.log(`[Database] Deleted read receipts for user ${userId}`);
    
    // 2. Delete media messages
    const mediaDeleted = await db.delete(mediaMessages).where(eq(mediaMessages.senderId, userId));
    console.log(`[Database] Deleted media messages for user ${userId}`);
    
    // 3. Delete messages
    const messagesDeleted = await db.delete(messages).where(eq(messages.senderId, userId));
    console.log(`[Database] Deleted messages for user ${userId}`);
    
    // 4. Delete conversations where user is participant
    const conversationsDeleted = await db.delete(conversations).where(
      or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      )
    );
    console.log(`[Database] Deleted conversations for user ${userId}`);
    
    // 5. Delete phone verifications
    const phoneVerificationsDeleted = await db.delete(phoneVerifications).where(eq(phoneVerifications.userId, userId));
    console.log(`[Database] Deleted phone verifications for user ${userId}`);
    
    // 6. Delete OTP codes if phone number exists
    if (phoneNumber) {
      const otpDeleted = await db.delete(otpCodes).where(eq(otpCodes.phoneNumber, phoneNumber));
      console.log(`[Database] Deleted OTP codes for phone ${phoneNumber}`);
    }
    
    // 7. Delete user profile
    const profileDeleted = await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
    console.log(`[Database] Deleted user profile for user ${userId}`);
    
    // 8. Finally delete user
    const userDeleted = await db.delete(users).where(eq(users.id, userId));
    console.log(`[Database] Deleted user ${userId}`);
    
    console.log(`[Database] Successfully completed account deletion for user: ${userId}`);
  } catch (error) {
    console.error("[Database] Failed to delete user account:", error);
    throw error;
  }
}

// Group Room functions
export async function createGroupRoom(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { groupRooms } = await import("../drizzle/schema");
  const result = await db.insert(groupRooms).values(data).returning();
  return result[0];
}

export async function getRoomByCode(roomCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { groupRooms } = await import("../drizzle/schema");
  const result = await db.select().from(groupRooms).where(eq(groupRooms.roomCode, roomCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGroupRoom(roomId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { groupRooms } = await import("../drizzle/schema");
  const result = await db.select().from(groupRooms).where(eq(groupRooms.id, roomId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveRooms() {
  const db = await getDb();
  if (!db) return [];
  
  const { groupRooms } = await import("../drizzle/schema");
  const result = await db.select().from(groupRooms).where(eq(groupRooms.isActive, true));
  return result;
}

export async function getUserActiveRooms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { groupRooms, groupParticipants } = await import("../drizzle/schema");
  const { and, isNull } = await import("drizzle-orm");
  
  const result = await db
    .select({
      id: groupRooms.id,
      name: groupRooms.name,
      description: groupRooms.description,
      roomCode: groupRooms.roomCode,
      maxParticipants: groupRooms.maxParticipants,
      createdAt: groupRooms.createdAt,
      isModerator: groupParticipants.isModerator,
    })
    .from(groupRooms)
    .innerJoin(groupParticipants, eq(groupRooms.id, groupParticipants.roomId))
    .where(
      and(
        eq(groupParticipants.userId, userId),
        isNull(groupParticipants.leftAt),
        eq(groupRooms.isActive, true)
      )
    );
  
  return result;
}

// Group Participant functions
export async function addGroupParticipant(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { groupParticipants } = await import("../drizzle/schema");
  const result = await db.insert(groupParticipants).values(data).returning();
  return result[0];
}

export async function getGroupParticipant(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { groupParticipants } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  const result = await db
    .select()
    .from(groupParticipants)
    .where(
      and(
        eq(groupParticipants.roomId, roomId),
        eq(groupParticipants.userId, userId)
      )
    )
    .orderBy((gp) => gp.joinedAt)
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveParticipantsCount(roomId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const { groupParticipants } = await import("../drizzle/schema");
  const { and, isNull, count } = await import("drizzle-orm");
  
  const result = await db
    .select({ count: count() })
    .from(groupParticipants)
    .where(
      and(
        eq(groupParticipants.roomId, roomId),
        isNull(groupParticipants.leftAt)
      )
    );
  
  return result[0]?.count || 0;
}

export async function getGroupParticipants(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { groupParticipants, userProfiles } = await import("../drizzle/schema");
  const { and, isNull } = await import("drizzle-orm");
  
  const result = await db
    .select({
      userId: groupParticipants.userId,
      username: userProfiles.username,
      profilePictureUrl: userProfiles.profilePictureUrl,
      joinedAt: groupParticipants.joinedAt,
      isModerator: groupParticipants.isModerator,
    })
    .from(groupParticipants)
    .innerJoin(userProfiles, eq(groupParticipants.userId, userProfiles.userId))
    .where(
      and(
        eq(groupParticipants.roomId, roomId),
        isNull(groupParticipants.leftAt)
      )
    );
  
  return result;
}

export async function leaveGroupRoom(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { groupParticipants } = await import("../drizzle/schema");
  const { and, isNull } = await import("drizzle-orm");
  
  await db
    .update(groupParticipants)
    .set({ leftAt: new Date() })
    .where(
      and(
        eq(groupParticipants.roomId, roomId),
        eq(groupParticipants.userId, userId),
        isNull(groupParticipants.leftAt)
      )
    );
}

// Group Message functions
export async function createGroupMessage(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { groupMessages } = await import("../drizzle/schema");
  const result = await db.insert(groupMessages).values(data).returning();
  return result[0];
}

export async function getGroupMessages(roomId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { groupMessages } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  const result = await db
    .select()
    .from(groupMessages)
    .where(
      and(
        eq(groupMessages.roomId, roomId),
        eq(groupMessages.isDeleted, false)
      )
    )
    .orderBy((gm) => gm.createdAt)
    .limit(limit);
  
  return result;
}

// Group Message Translation functions
export async function createGroupMessageTranslation(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { groupMessageTranslations } = await import("../drizzle/schema");
  const result = await db.insert(groupMessageTranslations).values(data).returning();
  return result[0];
}

export async function getGroupMessageTranslation(messageId: number, targetLanguage: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { groupMessageTranslations } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  const result = await db
    .select()
    .from(groupMessageTranslations)
    .where(
      and(
        eq(groupMessageTranslations.messageId, messageId),
        eq(groupMessageTranslations.targetLanguage, targetLanguage)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Search users by phone or username
export async function searchUsersByPhoneOrUsername(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { userProfiles } = await import("../drizzle/schema");
  const { or, like, sql } = await import("drizzle-orm");
  
  // Search by username or phone number
  const result = await db
    .select({
      userId: userProfiles.userId,
      username: userProfiles.username,
      phoneNumber: userProfiles.phoneNumber,
      profilePictureUrl: userProfiles.profilePictureUrl,
    })
    .from(userProfiles)
    .where(
      or(
        like(userProfiles.username, `%${query}%`),
        like(sql`CAST(${userProfiles.phoneNumber} AS TEXT)`, `%${query}%`)
      )
    )
    .limit(20);
  
  return result;
}

// Group Media Message functions
export async function createGroupMediaMessage(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { groupMediaMessages } = await import("../drizzle/schema");
  const result = await db.insert(groupMediaMessages).values(data).returning();
  return result[0];
}

export async function getGroupMediaMessages(roomId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { groupMediaMessages } = await import("../drizzle/schema");
  
  const result = await db
    .select()
    .from(groupMediaMessages)
    .where(eq(groupMediaMessages.roomId, roomId))
    .orderBy((gmm) => gmm.createdAt)
    .limit(limit);
  
  return result;
}

export async function getMediaMessageByMessageId(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { groupMediaMessages } = await import("../drizzle/schema");
  
  const result = await db
    .select()
    .from(groupMediaMessages)
    .where(eq(groupMediaMessages.messageId, messageId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Meeting Summary functions
export async function createMeetingSummary(data: {
  roomId: number;
  generatedBy: number;
  messageCount: number;
  participantCount: number;
  startTime: Date;
  endTime: Date;
  summaryData: string; // JSON string
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { meetingSummaries } = await import("../drizzle/schema");
  const result = await db.insert(meetingSummaries).values(data).returning();
  return result[0];
}

export async function getMeetingSummaries(roomId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const { meetingSummaries } = await import("../drizzle/schema");
  
  const result = await db
    .select()
    .from(meetingSummaries)
    .where(eq(meetingSummaries.roomId, roomId))
    .orderBy((ms) => ms.createdAt)
    .limit(limit);
  
  return result;
}

export async function getMeetingSummary(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { meetingSummaries } = await import("../drizzle/schema");
  
  const result = await db
    .select()
    .from(meetingSummaries)
    .where(eq(meetingSummaries.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Auto-delete helper functions
export function calculateAutoDeleteTime(
  autoDeleteDuration: number | null | undefined,
  readAt?: Date
): Date | null {
  if (autoDeleteDuration === null || autoDeleteDuration === undefined) {
    return null; // Auto-delete disabled
  }

  if (autoDeleteDuration === 0) {
    // Delete immediately after read
    if (!readAt) return null; // Not read yet
    return readAt;
  }

  // Delete after specified duration from creation
  const now = new Date();
  return new Date(now.getTime() + autoDeleteDuration * 1000);
}

export async function getAutoDeleteMessages() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const { messages } = await import("../drizzle/schema");
  const { and, lte, isNotNull, isNull } = await import("drizzle-orm");

  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        isNotNull(messages.autoDeleteAt),
        lte(messages.autoDeleteAt, now),
        isNull(messages.deletedAt)
      )
    )
    .limit(100);

  return result;
}

export async function getAutoDeleteGroupMessages() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const { groupMessages } = await import("../drizzle/schema");
  const { and, lte, isNotNull, eq } = await import("drizzle-orm");

  const result = await db
    .select()
    .from(groupMessages)
    .where(
      and(
        isNotNull(groupMessages.autoDeleteAt),
        lte(groupMessages.autoDeleteAt, now),
        eq(groupMessages.isDeleted, false)
      )
    )
    .limit(100);

  return result;
}

export async function deleteExpiredMessages(messageIds: number[]) {
  if (messageIds.length === 0) return;

  const db = await getDb();
  if (!db) return;

  const { messages } = await import("../drizzle/schema");
  const { inArray } = await import("drizzle-orm");

  await db
    .update(messages)
    .set({ deletedAt: new Date(), deletedBy: null })
    .where(inArray(messages.id, messageIds));
}

export async function deleteExpiredGroupMessages(messageIds: number[]) {
  if (messageIds.length === 0) return;

  const db = await getDb();
  if (!db) return;

  const { groupMessages } = await import("../drizzle/schema");
  const { inArray } = await import("drizzle-orm");

  await db
    .update(groupMessages)
    .set({ isDeleted: true })
    .where(inArray(groupMessages.id, messageIds));
}


// Blocked Users functions
export async function blockUser(blockerId: number, blockedId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [blocked] = await db.insert(blockedUsers).values({
    blockerId,
    blockedId,
    reason,
  }).returning();

  return blocked;
}

export async function unblockUser(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(blockedUsers)
    .where(and(
      eq(blockedUsers.blockerId, blockerId),
      eq(blockedUsers.blockedId, blockedId)
    ));
}

export async function isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [result] = await db.select()
    .from(blockedUsers)
    .where(and(
      eq(blockedUsers.blockerId, blockerId),
      eq(blockedUsers.blockedId, blockedId)
    ))
    .limit(1);

  return !!result;
}

export async function getBlockedUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const blocked = await db.select({
    id: blockedUsers.id,
    blockedId: blockedUsers.blockedId,
    reason: blockedUsers.reason,
    createdAt: blockedUsers.createdAt,
    username: userProfiles.username,
    profilePictureUrl: userProfiles.profilePictureUrl,
  })
    .from(blockedUsers)
    .leftJoin(userProfiles, eq(blockedUsers.blockedId, userProfiles.userId))
    .where(eq(blockedUsers.blockerId, userId));

  return blocked;
}

export async function getUsersWhoBlockedMe(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const blockers = await db.select()
    .from(blockedUsers)
    .where(eq(blockedUsers.blockedId, userId));

  return blockers.map(b => b.blockerId);
}

// Check if two users have blocked each other
export async function areUsersBlocked(userId1: number, userId2: number): Promise<boolean> {
  const blocked1 = await isUserBlocked(userId1, userId2);
  const blocked2 = await isUserBlocked(userId2, userId1);
  
  return blocked1 || blocked2;
}

// Export db instance for direct access
export const db = {
  get: getDb,
};
