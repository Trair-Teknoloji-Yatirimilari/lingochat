import { eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, userProfiles, conversations, messages, mediaMessages, readReceipts, InsertUserProfile, InsertConversation, InsertMessage, InsertMediaMessage, InsertReadReceipt } from "../drizzle/schema";
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
    .where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)));
  return result;
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

// Find user by phone or email
export async function findUserByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users)
    .where(or(eq(users.email, identifier)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
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
