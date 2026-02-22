-- Create push_tokens table for Expo push notifications
-- Migration: create_push_tokens_table
-- Date: 2026-02-22

CREATE TABLE IF NOT EXISTS "pushTokens" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "deviceId" VARCHAR(255),
  "platform" VARCHAR(20) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on userId for faster lookups
CREATE INDEX IF NOT EXISTS "idx_push_tokens_user_id" ON "pushTokens"("userId");

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS "idx_push_tokens_token" ON "pushTokens"("token");

-- Create index on isActive for filtering active tokens
CREATE INDEX IF NOT EXISTS "idx_push_tokens_is_active" ON "pushTokens"("isActive");

-- Add foreign key constraint to users table
ALTER TABLE "pushTokens" 
ADD CONSTRAINT "fk_push_tokens_user_id" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE;

-- Add comment to table
COMMENT ON TABLE "pushTokens" IS 'Stores Expo push notification tokens for users';
