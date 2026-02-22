# 🚀 DEPLOY TO PRODUCTION NOW

## Changes Ready to Deploy
- ✅ Fixed message display order (translated text first)
- ✅ Added participant count to room header
- ✅ Fixed push notification parameters
- ✅ Added detailed logging for push notifications
- ✅ Added getRoomParticipants function

## Deployment Command

Copy and paste this into your terminal connected to production server:

```bash
cd /var/www/lingochat && git pull origin main && pnpm install && pnpm run build && pm2 restart lingochat-api && pm2 logs lingochat-api --lines 30 --nostream
```

## After Deployment - Test Push Notifications

### 1. Check if TestFlight user has push token:
```bash
PGPASSWORD='LingoChat2026Secure!' psql -U lingochat_user -d lingochat -h localhost -c "SELECT user_id, token, platform, is_active, created_at FROM push_tokens WHERE user_id = 1 AND is_active = true;"
```

### 2. Test the flow:
1. **TestFlight**: Open the test room
2. **TestFlight**: Close the app completely (swipe up to kill)
3. **Simulator**: Send a message "Hello from Simulator"
4. **TestFlight**: Should receive push notification

### 3. Monitor logs:
```bash
pm2 logs lingochat-api --lines 50
```

Look for these log messages:
- `[Socket.IO] Checking push notifications for X participants`
- `[Socket.IO] User 1 online status: false`
- `[Socket.IO] Sending push notification to user 1`

## If Push Token is Missing

If TestFlight user doesn't have a push token, they need to:
1. Open TestFlight app
2. Grant notification permissions (if not already)
3. App will automatically register push token on login

## Expected Result

When Simulator sends "Hello from Simulator":
- TestFlight device shows notification
- Title: "User 239" or sender's username
- Body: "Hello from Simulator"
- Tap notification → Opens app to the room

## Troubleshooting

If no notification received:
1. Verify TestFlight app is completely closed
2. Check push token exists in database
3. Check notification permissions in iOS Settings
4. Check server logs for errors
5. Try restarting TestFlight app to re-register token
