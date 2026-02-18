import { integer, pgTable, text, timestamp, varchar, boolean, pgEnum } from "drizzle-orm/pg-core";

// Role enum for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// User profiles table - stores user language preference
export const userProfiles = pgTable("userProfiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().unique(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("tr").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  profilePictureUrl: text("profilePictureUrl"), // Cloudinary URL
  profilePicturePublicId: varchar("profilePicturePublicId", { length: 255 }), // For deletion
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// OTP table - stores one-time passwords for phone verification
export const otpCodes = pgTable("otpCodes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("maxAttempts").default(5).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Phone verification table - tracks verified phone numbers
export const phoneVerifications = pgTable("phoneVerifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull().unique(),
  countryCode: varchar("countryCode", { length: 3 }).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Conversations table - stores chat rooms
export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  participant1Id: integer("participant1Id").notNull(),
  participant2Id: integer("participant2Id").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Messages table - stores individual messages
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversationId").notNull(),
  senderId: integer("senderId").notNull(),
  originalText: text("originalText").notNull(),
  translatedText: text("translatedText"),
  senderLanguage: varchar("senderLanguage", { length: 10 }).notNull(),
  recipientLanguage: varchar("recipientLanguage", { length: 10 }).notNull(),
  isTranslated: boolean("isTranslated").default(false).notNull(),
  deletedBy: integer("deletedBy"), // User ID who deleted the message
  deletedAt: timestamp("deletedAt"), // When the message was deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Media messages table - stores media attachments
export const mediaMessages = pgTable("mediaMessages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer("messageId").notNull(),
  conversationId: integer("conversationId").notNull(),
  senderId: integer("senderId").notNull(),
  mediaType: varchar("mediaType", { length: 20 }).notNull(), // 'image', 'video', 'file'
  mediaUrl: text("mediaUrl").notNull(),
  cloudinaryPublicId: varchar("cloudinaryPublicId", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: integer("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  caption: text("caption"), // optional caption for media
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Read receipts table - tracks message read status
export const readReceipts = pgTable("readReceipts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer("messageId").notNull(),
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(), // User who read the message
  readAt: timestamp("readAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Export types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type MediaMessage = typeof mediaMessages.$inferSelect;
export type InsertMediaMessage = typeof mediaMessages.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;
export type PhoneVerification = typeof phoneVerifications.$inferSelect;
export type InsertPhoneVerification = typeof phoneVerifications.$inferInsert;
export type ReadReceipt = typeof readReceipts.$inferSelect;
export type InsertReadReceipt = typeof readReceipts.$inferInsert;
