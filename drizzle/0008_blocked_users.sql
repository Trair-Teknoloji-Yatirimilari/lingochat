-- Blocked users table for user blocking feature
CREATE TABLE IF NOT EXISTS "blockedUsers" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "blockerId" integer NOT NULL,
  "blockedId" integer NOT NULL,
  "reason" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  UNIQUE("blockerId", "blockedId")
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "blockedUsers_blockerId_idx" ON "blockedUsers" ("blockerId");
CREATE INDEX IF NOT EXISTS "blockedUsers_blockedId_idx" ON "blockedUsers" ("blockedId");
