# Implementation Plan: WebSocket Real-Time Messaging

## Overview

This implementation plan converts the WebSocket real-time messaging design into actionable coding tasks. The implementation follows a phased approach to ensure stability at each step, starting with authentication, then core messaging, then additional features.

The existing Socket.IO server (server/socket-io.ts) provides a foundation, but needs JWT authentication, message acknowledgment, and idempotency. The client currently uses HTTP polling and needs to be migrated to Socket.IO with connection resilience and optimistic UI updates.

## Tasks

- [x] 1. Add JWT authentication to Socket.IO server
  - Add JWT middleware to validate tokens during connection handshake
  - Extract userId from validated JWT and store in socket.data
  - Reject connections with invalid or expired tokens
  - Test authentication with valid and invalid tokens
  - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 3.4.1_

- [ ]* 1.1 Write property test for JWT authentication
  - **Property 1: Authentication Rejection**
  - **Validates: Requirements 2.1.2**
  - Generate random invalid/expired tokens, verify all connections are rejected
  - Generate valid tokens, verify all connections succeed

- [x] 2. Add database migration for client_message_id
  - Create migration file to add client_message_id column to messages table
  - Add client_message_id column to groupMessages table
  - Add unique constraint on client_message_id
  - Add index on client_message_id for fast lookups
  - Update Drizzle schema to include client_message_id field
  - _Requirements: 2.4.1_

- [x] 3. Implement idempotent message processing on server
  - [x] 3.1 Update message:send handler to accept clientMessageId
    - Modify server/socket-io.ts message:send event handler
    - Check if message with clientMessageId already exists
    - Return existing message if duplicate found
    - Save new message with clientMessageId if not duplicate
    - _Requirements: 2.4.2, 2.4.3, 2.4.4, 2.4.5_
  
  - [ ]* 3.2 Write property test for message idempotency
    - **Property 1: Message Idempotency**
    - **Validates: Requirements 2.4.3, 2.4.4, 2.4.5**
    - Send same message multiple times with same clientMessageId
    - Verify exactly one message exists in database
  
  - [x] 3.3 Update room:message handler for group messages
    - Apply same idempotency logic to group messages
    - Check for duplicate clientMessageId in groupMessages table
    - _Requirements: 2.4.2, 2.4.3, 2.4.4, 2.4.5_

- [x] 4. Create client-side Socket.IO hook
  - [x] 4.1 Create hooks/use-socket-io.ts with connection management
    - Initialize socket.io-client with JWT token from auth context
    - Manage connection state (connecting, connected, disconnected, error)
    - Implement automatic reconnection with exponential backoff
    - Provide methods: sendMessage, joinConversation, leaveConversation
    - Provide event listeners: onMessage, onTyping, onPresence
    - _Requirements: 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.2.5_
  
  - [x] 4.2 Implement message acknowledgment with retry
    - Generate UUID for clientMessageId
    - Send message with 5-second timeout
    - Retry up to 3 times with exponential backoff (1s, 2s, 4s)
    - Return success or throw error after max retries
    - _Requirements: 2.3.1, 2.3.2, 2.3.3, 2.3.4, 2.3.5_
  
  - [ ]* 4.3 Write property test for acknowledgment timeout
    - **Property 7: Acknowledgment Timeout**
    - **Validates: Requirements 2.3.2**
    - Simulate server delays, verify timeout fires at 5 seconds
  
  - [ ]* 4.4 Write property test for exponential backoff
    - **Property 8: Exponential Backoff**
    - **Validates: Requirements 2.3.5, 2.6.5**
    - Trigger retries, measure delays, verify pattern (1s, 2s, 4s)
  
  - [x] 4.3 Implement connection resilience
    - Handle disconnect events and trigger reconnection
    - Queue messages sent while offline
    - Send queued messages when connection restored
    - Implement exponential backoff for reconnection (1s, 2s, 4s, 8s, max 30s)
    - _Requirements: 2.6.1, 2.6.2, 2.6.3, 2.6.4, 2.6.5_
  
  - [x] 4.4 Implement offline message sync
    - Store last sync timestamp in local state
    - Fetch missed messages when reconnecting (since lastSyncTime)
    - Merge fetched messages with local optimistic messages
    - Deduplicate messages by ID
    - Sort messages by timestamp
    - _Requirements: 2.7.1, 2.7.2, 2.7.3, 2.7.4, 2.7.5_
  
  - [ ]* 4.5 Write property test for message ordering
    - **Property 2: Message Ordering**
    - **Validates: Requirements 2.7.5**
    - Send messages in random order, verify UI displays sorted by timestamp
  
  - [ ]* 4.6 Write property test for no message loss on reconnection
    - **Property 4: No Message Loss on Reconnection**
    - **Validates: Requirements 2.7.1, 2.7.2**
    - Disconnect client, send messages from others, reconnect, verify all appear

- [ ] 5. Checkpoint - Test Socket.IO hook in isolation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update app/room-detail.tsx to use Socket.IO
  - [x] 6.1 Replace HTTP polling with Socket.IO hook
    - Import and use useSocketIO hook instead of useGroupWebSocket
    - Remove trpc.groups.getMessages polling (refetchInterval)
    - Join conversation/room on component mount
    - Leave conversation/room on component unmount
    - _Requirements: 2.2.1, 2.2.4_
  
  - [x] 6.2 Implement optimistic UI updates
    - Generate temporary ID for new messages (temp-${Date.now()})
    - Add message to UI immediately with status: 'sending'
    - Update message with real ID when acknowledgment received
    - Update status to 'sent' on success
    - Update status to 'failed' on error with retry button
    - _Requirements: 2.5.1, 2.5.2, 2.5.3, 2.5.4, 2.5.5_
  
  - [x] 6.3 Add connection status indicator
    - Show "Connecting..." when socket is connecting
    - Show "Connected" indicator when socket is connected
    - Show "Offline" indicator when socket is disconnected
    - Show "Reconnecting..." during reconnection attempts
    - _Requirements: 2.6.2_
  
  - [x] 6.4 Handle real-time message events
    - Listen for message:new events and add to messages list
    - Deduplicate messages by ID (handle optimistic + real)
    - Scroll to bottom when new message arrives
    - _Requirements: 2.2.5_

- [ ] 7. Implement typing indicators
  - [ ] 7.1 Add typing indicator logic to client
    - Emit typing:start when user starts typing
    - Emit typing:stop after 2 seconds of inactivity
    - Emit typing:stop when message is sent
    - Clear timeout on component unmount
    - _Requirements: 2.8.1, 2.8.2, 2.8.3_
  
  - [ ] 7.2 Display typing indicators in UI
    - Listen for typing:start and typing:stop events
    - Show typing indicator for other users (not self)
    - Hide typing indicator when typing:stop received
    - Use existing TypingIndicator component
    - _Requirements: 2.8.4, 2.8.5, 2.8.6_
  
  - [ ]* 7.3 Write property test for typing indicator timeout
    - **Property 5: Typing Indicator Timeout**
    - **Validates: Requirements 2.8.2**
    - Simulate typing with random delays, verify indicator stops within 2s

- [ ] 8. Implement presence updates
  - [ ] 8.1 Add presence tracking to Socket.IO hook
    - Listen for user:online and user:offline events
    - Maintain Set of online user IDs
    - Provide onlineUsers state to consumers
    - _Requirements: 2.9.3_
  
  - [ ] 8.2 Display online status in UI
    - Show green dot for online users in participant list
    - Update online status in real-time
    - Handle multiple devices per user (online if any device connected)
    - _Requirements: 2.9.4, 2.9.5_
  
  - [ ] 8.3 Broadcast presence on join/leave
    - Server already broadcasts user:online on conversation:join
    - Server already broadcasts user:offline on disconnect
    - Verify presence updates work correctly
    - _Requirements: 2.9.1, 2.9.2_

- [ ] 9. Implement read receipts
  - [ ] 9.1 Add read receipt tracking to client
    - Use IntersectionObserver to detect when message enters viewport
    - Emit message:read event when message is viewed
    - Track read status per message
    - _Requirements: 2.10.1_
  
  - [ ] 9.2 Add read receipt handler to server
    - Listen for message:read events
    - Save read receipt to database (readReceipts table)
    - Broadcast read receipt to message sender
    - _Requirements: 2.10.2, 2.10.3_
  
  - [ ] 9.3 Display read receipts in UI
    - Show single checkmark for sent messages
    - Show double checkmark for delivered messages
    - Show blue checkmarks for read messages
    - Update checkmarks in real-time when read receipt received
    - _Requirements: 2.10.4, 2.10.5_

- [ ] 10. Add rate limiting to server
  - Implement rate limiting middleware for message:send events
  - Limit to 10 messages per second per user
  - Return error if rate limit exceeded
  - _Requirements: 3.4.4_

- [ ] 11. Add input validation and sanitization
  - Validate message text length (max 1000 characters)
  - Sanitize text input to prevent XSS attacks
  - Validate conversationId and roomId exist
  - Verify user is participant before allowing message send
  - _Requirements: 3.4.3_

- [ ] 12. Final checkpoint - Integration testing
  - Test complete message flow: send, acknowledge, receive
  - Test reconnection and offline message sync
  - Test typing indicators with multiple users
  - Test presence updates with multiple devices
  - Test read receipts end-to-end
  - Verify no duplicate messages with network interruptions
  - Verify message ordering is correct
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Performance optimization
  - Add database indexes for client_message_id lookups
  - Implement message batching for typing events (100ms window)
  - Limit in-memory message cache to 100 messages per conversation
  - Verify message delivery latency < 500ms
  - _Requirements: 3.1.1, 3.1.2, 3.1.3, 3.1.4_

- [ ] 14. Documentation and cleanup
  - Document Socket.IO events and their payloads
  - Add JSDoc comments to use-socket-io.ts hook
  - Update README with WebSocket setup instructions
  - Remove old HTTP polling code (after verification)
  - Add migration guide for developers

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at critical milestones
- Property tests validate universal correctness properties
- Implementation follows phased approach: auth → messaging → features
- Keep HTTP polling code until WebSocket is proven stable (rollback plan)
- Test thoroughly at each phase before proceeding to next
