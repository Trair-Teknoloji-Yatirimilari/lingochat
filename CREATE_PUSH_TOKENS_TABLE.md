# Create Push Tokens Table in Production

## Problem
`push_tokens` table doesn't exist in production database.

## Solution
Run the migration SQL to create the table.

## Commands to Run on Production Server

### 1. Create the table:
```bash
PGPASSWORD='LingoChat2026Secure!' psql -U lingochat_user -d lingochat -h localhost << 'EOF'
-- Create push_tokens table for Expo push notifications
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_push_tokens_user_id" ON "pushTokens"("userId");
CREATE INDEX IF NOT EXISTS "idx_push_tokens_token" ON "pushTokens"("token");
CREATE INDEX IF NOT EXISTS "idx_push_tokens_is_active" ON "pushTokens"("isActive");

-- Add foreign key constraint
ALTER TABLE "pushTokens" 
ADD CONSTRAINT "fk_push_tokens_user_id" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE;

-- Add comment
COMMENT ON TABLE "pushTokens" IS 'Stores Expo push notification tokens for users';
EOF
```

### 2. Verify table was created:
```bash
PGPASSWORD='LingoChat2026Secure!' psql -U lingochat_user -d lingochat -h localhost -c "\d pushTokens"
```

### 3. Check if any tokens exist:
```bash
PGPASSWORD='LingoChat2026Secure!' psql -U lingochat_user -d lingochat -h localhost -c "SELECT COUNT(*) FROM \"pushTokens\";"
```

## After Creating Table

### Test Push Token Registration

1. **TestFlight**: Open the app
2. **TestFlight**: App should automatically register push token
3. **Check database**:
```bash
PGPASSWORD='LingoChat2026Secure!' psql -U lingochat_user -d lingochat -h localhost -c "SELECT \"userId\", token, platform, \"isActive\", \"createdAt\" FROM \"pushTokens\" WHERE \"userId\" = 1;"
```

### If No Token Appears

TestFlight user needs to:
1. Close app completely
2. Reopen app
3. Grant notification permissions if prompted
4. Token should register automatically on login

### Manual Token Registration Test

You can test the registration endpoint from the app:
```typescript
// In any screen with tRPC
const registerToken = trpc.pushNotifications.registerToken.useMutation();
```

## Next Steps

After table is created and token is registered:
1. Test push notification by sending message from Simulator
2. TestFlight should receive notification when app is closed
3. Monitor logs: `pm2 logs lingochat-api --lines 50`
