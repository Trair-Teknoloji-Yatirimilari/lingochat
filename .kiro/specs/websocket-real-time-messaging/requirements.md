# Requirements: WebSocket Real-Time Messaging

## 1. User Stories

### 1.1 Real-Time Message Delivery
As a user, I want messages to be delivered instantly without polling, so that conversations feel natural and responsive.

### 1.2 Reliable Message Delivery
As a user, I want my messages to be delivered reliably even with poor network conditions, so that I don't lose important communications.

### 1.3 Secure Communication
As a user, I want my WebSocket connections to be authenticated, so that only authorized users can send and receive messages.

### 1.4 Offline Resilience
As a user, I want the app to handle connection drops gracefully and sync messages when I reconnect, so that I don't miss any messages.

### 1.5 Message Status Visibility
As a user, I want to see when my messages are sent and acknowledged, so that I know they were received by the server.

## 2. Functional Requirements

### 2.1 JWT Authentication
- [ ] 2.1.1 Socket.IO server MUST authenticate connections using JWT tokens
- [ ] 2.1.2 Server MUST reject connections with invalid or expired tokens
- [ ] 2.1.3 Server MUST extract userId from validated JWT token
- [ ] 2.1.4 Client MUST send JWT token during Socket.IO connection handshake

### 2.2 Client-Side Socket.IO Integration
- [ ] 2.2.1 Client MUST establish WebSocket connection using Socket.IO client library
- [ ] 2.2.2 Client MUST automatically reconnect with exponential backoff on connection loss
- [ ] 2.2.3 Client MUST handle connection state changes (connecting, connected, disconnected)
- [ ] 2.2.4 Client MUST emit events for: message:send, typing:start, typing:stop, conversation:join, conversation:leave
- [ ] 2.2.5 Client MUST listen for events: message:new, message:ack, typing:start, typing:stop, user:online, user:offline

### 2.3 Message Acknowledgment with Retry
- [ ] 2.3.1 Server MUST send acknowledgment (message:ack) when message is saved to database
- [ ] 2.3.2 Client MUST wait for acknowledgment with 5-second timeout
- [ ] 2.3.3 Client MUST retry sending message up to 3 times if no acknowledgment received
- [ ] 2.3.4 Client MUST show error state if all retries fail
- [ ] 2.3.5 Client MUST use exponential backoff for retries (1s, 2s, 4s)

### 2.4 Idempotent Message Processing
- [ ] 2.4.1 Database MUST have client_message_id column for deduplication
- [ ] 2.4.2 Client MUST generate unique client_message_id (UUID) for each message
- [ ] 2.4.3 Server MUST check if client_message_id already exists before saving
- [ ] 2.4.4 Server MUST return existing message if client_message_id is duplicate
- [ ] 2.4.5 Server MUST prevent duplicate messages from being saved

### 2.5 Optimistic UI Updates
- [ ] 2.5.1 Client MUST show message immediately in UI when user sends it
- [ ] 2.5.2 Client MUST mark optimistic message with "sending" status
- [ ] 2.5.3 Client MUST update message status to "sent" when acknowledgment received
- [ ] 2.5.4 Client MUST replace optimistic message with server message (with real ID)
- [ ] 2.5.5 Client MUST show error indicator if message fails to send

### 2.6 Connection Resilience
- [ ] 2.6.1 Client MUST detect connection loss within 5 seconds
- [ ] 2.6.2 Client MUST show connection status indicator in UI
- [ ] 2.6.3 Client MUST queue messages sent while offline
- [ ] 2.6.4 Client MUST send queued messages when connection is restored
- [ ] 2.6.5 Client MUST use exponential backoff for reconnection attempts (1s, 2s, 4s, 8s, max 30s)

### 2.7 Offline Message Sync
- [ ] 2.7.1 Client MUST fetch missed messages when reconnecting after being offline
- [ ] 2.7.2 Client MUST use last received message timestamp to fetch only new messages
- [ ] 2.7.3 Client MUST merge fetched messages with local optimistic messages
- [ ] 2.7.4 Client MUST deduplicate messages by ID
- [ ] 2.7.5 Client MUST maintain message order by timestamp

### 2.8 Typing Indicators
- [ ] 2.8.1 Client MUST emit typing:start when user starts typing
- [ ] 2.8.2 Client MUST emit typing:stop after 2 seconds of inactivity
- [ ] 2.8.3 Client MUST emit typing:stop when message is sent
- [ ] 2.8.4 Client MUST display typing indicator when receiving typing:start event
- [ ] 2.8.5 Client MUST hide typing indicator when receiving typing:stop event
- [ ] 2.8.6 Client MUST NOT show typing indicator for own messages

### 2.9 Presence Updates
- [ ] 2.9.1 Server MUST broadcast user:online when user joins conversation
- [ ] 2.9.2 Server MUST broadcast user:offline when user leaves conversation or disconnects
- [ ] 2.9.3 Client MUST update user online status in UI
- [ ] 2.9.4 Client MUST show online indicator for active users
- [ ] 2.9.5 Client MUST handle multiple devices per user (user is online if any device is connected)

### 2.10 Read Receipts
- [ ] 2.10.1 Client MUST emit message:read event when message is viewed
- [ ] 2.10.2 Server MUST update message read status in database
- [ ] 2.10.3 Server MUST broadcast read receipt to message sender
- [ ] 2.10.4 Client MUST display read indicator (checkmarks) on sent messages
- [ ] 2.10.5 Client MUST show single checkmark for sent, double for delivered, blue for read

## 3. Non-Functional Requirements

### 3.1 Performance
- [ ] 3.1.1 Message delivery latency MUST be < 500ms under normal conditions
- [ ] 3.1.2 Connection establishment MUST complete within 3 seconds
- [ ] 3.1.3 Reconnection MUST complete within 5 seconds
- [ ] 3.1.4 Client MUST handle 100+ messages per conversation without performance degradation

### 3.2 Scalability
- [ ] 3.2.1 Server MUST support 1000+ concurrent WebSocket connections
- [ ] 3.2.2 Server MUST use Socket.IO rooms for efficient message broadcasting
- [ ] 3.2.3 Server MUST be horizontally scalable (support multiple instances with Redis adapter)

### 3.3 Reliability
- [ ] 3.3.1 System MUST guarantee at-least-once message delivery
- [ ] 3.3.2 System MUST prevent duplicate messages through idempotency
- [ ] 3.3.3 System MUST handle network interruptions gracefully
- [ ] 3.3.4 System MUST recover from server restarts without data loss

### 3.4 Security
- [ ] 3.4.1 All WebSocket connections MUST be authenticated with JWT
- [ ] 3.4.2 Server MUST validate user permissions before broadcasting messages
- [ ] 3.4.3 Server MUST sanitize all user input to prevent XSS attacks
- [ ] 3.4.4 Server MUST rate-limit message sending to prevent spam (max 10 messages/second per user)

### 3.5 Compatibility
- [ ] 3.5.1 Client MUST work on iOS and Android devices
- [ ] 3.5.2 Client MUST fallback to HTTP polling if WebSocket is unavailable
- [ ] 3.5.3 Client MUST work with React Native and Expo

## 4. Technical Constraints

### 4.1 Technology Stack
- Server: Node.js with Socket.IO
- Client: React Native with socket.io-client
- Database: PostgreSQL with Drizzle ORM
- Authentication: JWT tokens

### 4.2 Existing Implementation
- Socket.IO server already exists in server/socket-io.ts
- Server has basic event handlers for conversations and rooms
- Client currently uses HTTP polling (needs migration to Socket.IO)
- JWT authentication exists for HTTP endpoints but not WebSocket

### 4.3 Migration Requirements
- Must maintain backward compatibility during migration
- Must not break existing HTTP polling functionality until WebSocket is stable
- Must migrate one feature at a time (messages first, then typing, then presence)

## 5. Acceptance Criteria

### 5.1 Core Functionality
- [ ] User can send and receive messages in real-time without page refresh
- [ ] Messages are delivered within 500ms under normal network conditions
- [ ] Connection is authenticated with JWT token
- [ ] Messages are not lost during network interruptions

### 5.2 Reliability
- [ ] Messages are retried automatically if delivery fails
- [ ] Duplicate messages are prevented through idempotency
- [ ] Offline messages are synced when connection is restored
- [ ] Connection recovers automatically after network interruption

### 5.3 User Experience
- [ ] User sees immediate feedback when sending message (optimistic UI)
- [ ] User sees connection status indicator
- [ ] User sees typing indicators from other participants
- [ ] User sees online/offline status of other participants
- [ ] User sees read receipts on sent messages

### 5.4 Error Handling
- [ ] User sees clear error message if message fails to send
- [ ] User can retry failed messages manually
- [ ] App handles connection errors gracefully without crashing
- [ ] App shows helpful error messages for authentication failures

## 6. Out of Scope

- Video/audio calling
- File upload progress tracking via WebSocket
- End-to-end encryption
- Message editing/deletion via WebSocket (use HTTP for now)
- Group video chat
- Screen sharing
- Voice messages
