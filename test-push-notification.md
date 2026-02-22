# Push Notification Test Guide

## Current Status
- ✅ Push notification code implemented in `server/socket-io.ts`
- ✅ Push token registration implemented in `components/push-token-registrar.tsx`
- ✅ Code pushed to GitHub (commit: a6fcb3e)
- 🔄 Needs deployment to production server

## Test Setup

### Devices:
1. **Simulator** (05346408888, userId: 239) - English
2. **TestFlight** (05321646788, userId: 1) - Turkish

### Prerequisites:
1. TestFlight user must have granted notification permissions
2. TestFlight user's push token must be registered in database
3. Production server must be running latest code

## Deployment Steps

Run on production server (91.98.164.2):
```bash
cd /var/www/lingochat
git pull origin main
pnpm install
pnpm run build
pm2 restart lingochat-api
```

## Testing Steps

### Step 1: Verify Push Token Registration
Check if TestFlight user (userId: 1) has a push token:
```sql
-- On production server
PGPASSWORD='LingoChat2026Secure!' psql -U lingochat_user -d lingochat -h localhost -c "SELECT * FROM push_tokens WHERE user_id = 1 AND is_active = true;"
```

### Step 2: Test Message Flow
1. Open TestFlight app on device
2. Go to the test room
3. **Close the app** or put it in background (important for push notification)
4. From Simulator, send a message: "Hello from Simulator"
5. TestFlight device should receive push notification with:
   - Title: Sender's username
   - Body: "Hello from Simulator"

### Step 3: Check Logs
Monitor server logs for push notification activity:
```bash
pm2 logs lingochat-api --lines 50
```

Look for:
- `[Socket.IO] Checking push notifications for X participants`
- `[Socket.IO] User X online status: false`
- `[Socket.IO] Sending push notification to user X`

## Troubleshooting

### If no push notification received:

1. **Check if user is marked as offline:**
   - TestFlight app must be closed or in background
   - Socket.IO connection must be disconnected

2. **Check push token:**
   ```sql
   SELECT * FROM push_tokens WHERE user_id = 1;
   ```
   - Should have `is_active = true`
   - Token should start with `ExponentPushToken[`

3. **Check notification permissions:**
   - TestFlight app: Settings > Notifications > LingoChat
   - Should be enabled

4. **Check server logs:**
   ```bash
   pm2 logs lingochat-api --lines 100 | grep -i "push\|notification"
   ```

5. **Test with tRPC endpoint:**
   You can manually test push notification from the app:
   ```typescript
   // In any screen
   const testPush = trpc.pushNotifications.sendTestNotification.useMutation();
   testPush.mutate({ userId: 1, message: "Test" });
   ```

## Expected Behavior

### When TestFlight is ONLINE (app open):
- ❌ No push notification sent
- ✅ Message appears in real-time via Socket.IO or polling

### When TestFlight is OFFLINE (app closed/background):
- ✅ Push notification sent
- ✅ Notification appears on device
- ✅ User can tap notification to open app

## Debug Checklist

- [ ] Production server has latest code (commit: a6fcb3e)
- [ ] PM2 service restarted
- [ ] TestFlight user has push token in database
- [ ] TestFlight app has notification permissions
- [ ] TestFlight app is closed/backgrounded during test
- [ ] Simulator sends message successfully
- [ ] Server logs show push notification attempt
- [ ] TestFlight device receives notification

## Next Steps After Successful Test

1. Test with multiple users
2. Test with different message types (text, media)
3. Test notification tap behavior (deep linking to room)
4. Add notification sound customization
5. Add notification badge count
