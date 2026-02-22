-- Add moderator action columns to groupParticipants table
ALTER TABLE "groupParticipants" 
ADD COLUMN IF NOT EXISTS "isBanned" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "bannedAt" timestamp,
ADD COLUMN IF NOT EXISTS "isMuted" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "mutedUntil" timestamp;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_group_participants_banned" ON "groupParticipants" ("roomId", "isBanned");
CREATE INDEX IF NOT EXISTS "idx_group_participants_muted" ON "groupParticipants" ("roomId", "isMuted");
