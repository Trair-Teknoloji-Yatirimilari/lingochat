-- Push tokens table for storing Expo push notification tokens
CREATE TABLE IF NOT EXISTS "pushTokens" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" integer NOT NULL,
  "token" varchar(255) NOT NULL UNIQUE,
  "deviceId" varchar(255),
  "platform" varchar(20) NOT NULL, -- 'ios', 'android', 'web'
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "pushTokens_userId_idx" ON "pushTokens" ("userId");
CREATE INDEX IF NOT EXISTS "pushTokens_token_idx" ON "pushTokens" ("token");
