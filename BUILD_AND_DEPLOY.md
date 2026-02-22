# 🚀 Build and Deploy Guide

## Current Status
- Version: 1.0.0
- Latest commit: 23a45ad (Optimize message sending)
- All features working in Simulator
- Ready for TestFlight deployment

## Step 1: Update Production Server ✅

SSH into production server and run:

```bash
cd /var/www/lingochat
git pull origin main
pnpm install
pnpm run build
pm2 restart lingochat-api
pm2 logs lingochat-api --lines 20
```

Expected output:
- Latest commit pulled
- Dependencies installed
- Build successful
- PM2 restarted
- No errors in logs

## Step 2: Build for TestFlight 📱

### Prerequisites
- EAS CLI installed: `npm install -g eas-cli`
- Logged in to EAS: `eas login`
- Apple Developer account configured

### Build Commands

#### iOS Build (TestFlight)
```bash
# Build for iOS
eas build --platform ios --profile production

# Or for internal testing
eas build --platform ios --profile preview
```

#### Submit to TestFlight
```bash
# After build completes, submit to App Store Connect
eas submit --platform ios --latest
```

### Build Profiles

Check `eas.json` for available profiles:
- `development`: Development builds
- `preview`: Internal testing (TestFlight)
- `production`: App Store release

## Step 3: Monitor Build Progress

1. Build will start on EAS servers
2. Check progress: https://expo.dev/accounts/[your-account]/projects/lingo-chat-app/builds
3. Build takes ~10-15 minutes
4. Download IPA or submit directly to TestFlight

## Step 4: TestFlight Distribution

After submission:
1. Go to App Store Connect
2. Navigate to TestFlight tab
3. Build will appear in ~5-10 minutes
4. Add internal testers
5. Testers will receive notification

## What's New in This Build

### Features ✅
- Real-time messaging with Socket.IO
- Push notifications for offline users
- Instant message sending (no waiting)
- Inline search bar
- Participants list modal
- AI meeting summary
- Message translation (correct order)
- Real usernames display
- Auto-scroll to latest message
- Enter key to send

### Performance ⚡
- Message sending: Instant (no 3-4 second delay)
- Socket.IO connection: < 1 second
- Push notification delivery: < 1 second
- Search: < 200ms

### Bug Fixes 🐛
- Fixed duplicate messages
- Fixed translation display order
- Fixed username display
- Fixed send button staying gray
- Fixed message input clearing

## Testing Checklist

After TestFlight installation:

### Basic Functionality
- [ ] Login with phone number
- [ ] Create/join room with code
- [ ] Send message (should be instant)
- [ ] Receive message from other user
- [ ] Push notification when app closed

### New Features
- [ ] Search messages (inline search bar)
- [ ] View participants list
- [ ] Generate AI summary (5+ messages)
- [ ] Real-time messaging (Socket.IO)
- [ ] Message translation

### Performance
- [ ] Message sends instantly (no delay)
- [ ] Send button doesn't stay gray
- [ ] Messages appear in real-time
- [ ] No lag or freezing

## Rollback Plan

If issues found:
1. Previous build still available in TestFlight
2. Users can revert to previous version
3. Fix issues and create new build

## Version History

### v1.0.0 (Current)
- Initial release with all features
- Socket.IO real-time messaging
- Push notifications
- AI meeting summary
- Message search
- Participants list

## Support

If build fails:
1. Check EAS build logs
2. Verify Apple Developer certificates
3. Check bundle identifier matches
4. Ensure all dependencies installed

## Notes

- Bundle ID: `com.trairx.lingochat`
- EAS Project ID: `ef843343-29c0-4111-a642-eee82ab27c55`
- Minimum iOS: 13.0
- Supports: iPhone, iPad

## Next Steps After Deployment

1. Monitor crash reports in App Store Connect
2. Check user feedback in TestFlight
3. Monitor server logs for errors
4. Prepare for App Store submission
