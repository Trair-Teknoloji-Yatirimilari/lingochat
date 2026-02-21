-- Performance indexes for LingoChat
-- Run this migration to improve query performance

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversationId, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(senderId);

CREATE INDEX IF NOT EXISTS idx_messages_deleted 
ON messages(deletedAt, deletedBy);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
ON conversations(participant1Id, participant2Id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated 
ON conversations(updatedAt DESC);

-- Read receipts indexes
CREATE INDEX IF NOT EXISTS idx_read_receipts_message 
ON "readReceipts"(messageId);

CREATE INDEX IF NOT EXISTS idx_read_receipts_user 
ON "readReceipts"(userId);

CREATE INDEX IF NOT EXISTS idx_read_receipts_conversation 
ON "readReceipts"(conversationId);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user 
ON "userProfiles"(userId);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username 
ON "userProfiles"(username);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone 
ON "userProfiles"(phoneNumber);

-- Phone verifications indexes
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone 
ON "phoneVerifications"(phoneNumber);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user 
ON "phoneVerifications"(userId);

-- Media messages indexes
CREATE INDEX IF NOT EXISTS idx_media_messages_conversation 
ON "mediaMessages"(conversationId);

CREATE INDEX IF NOT EXISTS idx_media_messages_message 
ON "mediaMessages"(messageId);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group 
ON "groupMembers"(groupId);

CREATE INDEX IF NOT EXISTS idx_group_members_user 
ON "groupMembers"(userId);

-- Blocking indexes
CREATE INDEX IF NOT EXISTS idx_blocking_blocker 
ON blocking(blockerId);

CREATE INDEX IF NOT EXISTS idx_blocking_blocked 
ON blocking(blockedId);

-- Push tokens indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user 
ON "pushTokens"(userId);

CREATE INDEX IF NOT EXISTS idx_push_tokens_token 
ON "pushTokens"(token);

-- OTP codes indexes
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone 
ON "otpCodes"(phoneNumber);

CREATE INDEX IF NOT EXISTS idx_otp_codes_expires 
ON "otpCodes"(expiresAt);

COMMENT ON INDEX idx_messages_conversation_created IS 'Optimize message list queries';
COMMENT ON INDEX idx_conversations_participants IS 'Optimize conversation lookup by participants';
COMMENT ON INDEX idx_read_receipts_conversation IS 'Optimize read receipts queries';
