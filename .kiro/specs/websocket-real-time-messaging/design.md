# Design: WebSocket Real-Time Messaging

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  React Native   │      Socket.IO Client      │   Socket.IO     │
│     Client      │                            │     Server      │
│                 │         HTTP/REST          │                 │
│  (Expo App)     │◄──────────────────────────►│  (Node.js)      │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                                        │ SQL
                                                        ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                │    Database     │
                                                └─────────────────┘
```

### 1.2 Communication Flow

1. Client authenticates with JWT token during WebSocket handshake
2. Server validates JWT and extracts userId
3. Client joins conversation/room channels
4. Client sends messages via WebSocket events
5. Server saves to database and broadcasts to room
6. Server sends acknowledgment back to sender
7. All participants receive message in real-time

## 2. Component Design

### 2.1 JWT Authentication Middleware

**Location:** `server/socket-io.ts`

**Purpose:** Authenticate WebSocket connections using JWT tokens

**Implementation:**

```typescript
// Middleware function
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error("Authentication token required"));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});
```

**Requirements Mapping:** 2.1.1, 2.1.2, 2.1.3, 3.4.1

### 2.2 Client Socket.IO Hook

**Location:** `hooks/use-socket-io.ts`

**Purpose:** Manage WebSocket connection lifecycle and provide event interface

**Interface:**
```typescript
interface UseSocketIOReturn {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  sendMessage: (conversationId: number, data: MessageData) => Promise<void>;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  onMessage: (callback: (message: Message) => void) => void;
  onTyping: (callback: (userId: number, isTyping: boolean) => void) => void;
  onPresence: (callback: (userId: number, isOnline: boolean) => void) => void;
}
```

**State Management:**
- Connection state: connecting | connected | disconnected | error
- Pending messages queue (for offline mode)
- Retry counters per message
- Last sync timestamp

**Requirements Mapping:** 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.2.5

### 2.3 Message Acknowledgment System

**Client-Side Logic:**
```typescript
async function sendMessageWithRetry(conversationId: number, data: MessageData) {
  const clientMessageId = generateUUID();
  const maxRetries = 3;
  const timeouts = [1000, 2000, 4000]; // Exponential backoff
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ack = await sendMessageWithTimeout(conversationId, {
        ...data,
        clientMessageId
      }, 5000);
      
      if (ack.success) {
        return ack.messageId;
      }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await sleep(timeouts[attempt]);
      }
    }
  }
  
  throw new Error("Failed to send message after retries");
}
```

**Server-Side Logic:**
```typescript
socket.on("message:send", async (conversationId, data, callback) => {
  try {
    // Check for duplicate
    const existing = await db.findMessageByClientId(data.clientMessageId);
    if (existing) {
      return callback({ success: true, messageId: existing.id });
    }
    
    // Save new message
    const message = await db.createMessage({
      ...data,
      clientMessageId: data.clientMessageId
    });
    
    // Broadcast to room
    io.to(`conversation:${conversationId}`).emit("message:new", message);
    
    // Send acknowledgment
    callback({ success: true, messageId: message.id });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});
```

**Requirements Mapping:** 2.3.1, 2.3.2, 2.3.3, 2.3.4, 2.3.5, 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.5

### 2.4 Database Schema Changes

**New Column for Messages Table:**
```sql
ALTER TABLE messages 
ADD COLUMN client_message_id VARCHAR(36) UNIQUE;

CREATE INDEX idx_messages_client_message_id 
ON messages(client_message_id);
```

**New Column for Group Messages Table:**
```sql
ALTER TABLE groupMessages 
ADD COLUMN client_message_id VARCHAR(36) UNIQUE;

CREATE INDEX idx_group_messages_client_message_id 
ON groupMessages(client_message_id);
```

**Requirements Mapping:** 2.4.1

### 2.5 Optimistic UI Updates

**Client-Side Implementation:**
```typescript
function sendMessage(text: string) {
  const optimisticMessage = {
    id: `temp-${Date.now()}`,
    conversationId,
    senderId: currentUserId,
    text,
    status: 'sending',
    createdAt: new Date()
  };
  
  // Add to UI immediately
  setMessages(prev => [...prev, optimisticMessage]);
  
  // Send to server
  sendMessageWithRetry(conversationId, { text })
    .then(messageId => {
      // Update with real ID
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, id: messageId, status: 'sent' }
          : msg
      ));
    })
    .catch(error => {
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'failed', error }
          : msg
      ));
    });
}
```

**Requirements Mapping:** 2.5.1, 2.5.2, 2.5.3, 2.5.4, 2.5.5

### 2.6 Connection Resilience

**Reconnection Strategy:**
```typescript
const reconnectionDelays = [1000, 2000, 4000, 8000, 16000, 30000];
let reconnectionAttempt = 0;

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    socket.connect();
  }
  // Otherwise, socket.io will auto-reconnect
});

socket.io.on('reconnect_attempt', (attempt) => {
  const delay = reconnectionDelays[Math.min(attempt - 1, reconnectionDelays.length - 1)];
  socket.io.opts.reconnectionDelay = delay;
});

socket.on('connect', () => {
  reconnectionAttempt = 0;
  // Rejoin all conversations
  activeConversations.forEach(id => socket.emit('conversation:join', id));
  // Sync missed messages
  syncMissedMessages();
});
```

**Requirements Mapping:** 2.6.1, 2.6.2, 2.6.3, 2.6.4, 2.6.5

### 2.7 Offline Message Sync

**Sync Strategy:**
```typescript
async function syncMissedMessages() {
  const lastSyncTime = getLastSyncTimestamp();
  
  for (const conversationId of activeConversations) {
    const missedMessages = await api.getMessages({
      conversationId,
      since: lastSyncTime
    });
    
    // Merge with local messages
    setMessages(prev => {
      const combined = [...prev, ...missedMessages];
      // Deduplicate by ID
      const unique = Array.from(
        new Map(combined.map(m => [m.id, m])).values()
      );
      // Sort by timestamp
      return unique.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }
  
  setLastSyncTimestamp(Date.now());
}
```

**Requirements Mapping:** 2.7.1, 2.7.2, 2.7.3, 2.7.4, 2.7.5

### 2.8 Typing Indicators

**Client-Side Implementation:**
```typescript
let typingTimeout: NodeJS.Timeout | null = null;

function handleTextChange(text: string) {
  setText(text);
  
  // Emit typing:start
  if (!isTyping) {
    socket.emit('typing:start', conversationId);
    setIsTyping(true);
  }
  
  // Reset timeout
  if (typingTimeout) clearTimeout(typingTimeout);
  
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', conversationId);
    setIsTyping(false);
  }, 2000);
}

function handleSendMessage() {
  if (typingTimeout) clearTimeout(typingTimeout);
  socket.emit('typing:stop', conversationId);
  setIsTyping(false);
  // ... send message
}
```

**Server-Side Implementation:**
```typescript
socket.on('typing:start', (conversationId) => {
  socket.to(`conversation:${conversationId}`).emit('typing:start', socket.data.userId);
});

socket.on('typing:stop', (conversationId) => {
  socket.to(`conversation:${conversationId}`).emit('typing:stop', socket.data.userId);
});
```

**Requirements Mapping:** 2.8.1, 2.8.2, 2.8.3, 2.8.4, 2.8.5, 2.8.6

### 2.9 Presence Updates

**Server-Side Implementation:**
```typescript
socket.on('conversation:join', (conversationId) => {
  const room = `conversation:${conversationId}`;
  socket.join(room);
  socket.data.conversationIds.add(conversationId);
  
  // Notify others user is online
  socket.to(room).emit('user:online', socket.data.userId);
});

socket.on('disconnect', () => {
  // Notify all conversations user is offline
  socket.data.conversationIds.forEach(conversationId => {
    socket.to(`conversation:${conversationId}`).emit('user:offline', socket.data.userId);
  });
});
```

**Client-Side Implementation:**
```typescript
const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

socket.on('user:online', (userId) => {
  setOnlineUsers(prev => new Set(prev).add(userId));
});

socket.on('user:offline', (userId) => {
  setOnlineUsers(prev => {
    const next = new Set(prev);
    next.delete(userId);
    return next;
  });
});
```

**Requirements Mapping:** 2.9.1, 2.9.2, 2.9.3, 2.9.4, 2.9.5

### 2.10 Read Receipts

**Client-Side Implementation:**
```typescript
// Mark message as read when it enters viewport
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const messageId = entry.target.dataset.messageId;
        socket.emit('message:read', parseInt(messageId));
      }
    });
  });
  
  messageRefs.current.forEach(ref => observer.observe(ref));
  
  return () => observer.disconnect();
}, [messages]);
```

**Server-Side Implementation:**
```typescript
socket.on('message:read', async (messageId) => {
  await db.createReadReceipt({
    messageId,
    userId: socket.data.userId,
    readAt: new Date()
  });
  
  // Get message to find sender
  const message = await db.getMessage(messageId);
  
  // Notify sender
  io.to(`user:${message.senderId}`).emit('message:read', {
    messageId,
    readBy: socket.data.userId,
    readAt: new Date()
  });
});
```

**Requirements Mapping:** 2.10.1, 2.10.2, 2.10.3, 2.10.4, 2.10.5

## 3. Data Flow Diagrams

### 3.1 Message Send Flow

```
User Types Message
       │
       ▼
Generate UUID (clientMessageId)
       │
       ▼
Add to UI (optimistic, status: sending)
       │
       ▼
Emit message:send with clientMessageId
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
Server receives                    5s timeout
       │                                 │
       ▼                                 ▼
Check duplicate (clientMessageId)   No ACK received
       │                                 │
       ├─ Exists ─► Return existing     ▼
       │                                Retry (3x with backoff)
       ▼                                 │
Save to database                        ▼
       │                           All retries failed
       ▼                                 │
Broadcast to room                       ▼
       │                           Mark as failed in UI
       ▼
Send ACK to sender
       │
       ▼
Update UI (status: sent, real ID)
```

### 3.2 Reconnection Flow

```
Connection Lost
       │
       ▼
Show "Connecting..." indicator
       │
       ▼
Queue new messages locally
       │
       ▼
Attempt reconnection (exponential backoff)
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
Connection restored              Max retries reached
       │                                 │
       ▼                                 ▼
Rejoin all conversations        Show error, allow manual retry
       │
       ▼
Fetch missed messages (since lastSyncTime)
       │
       ▼
Merge with local messages (deduplicate)
       │
       ▼
Send queued messages
       │
       ▼
Update UI (status: connected)
```

## 4. Error Handling

### 4.1 Authentication Errors
- **Error:** Invalid or expired JWT token
- **Handling:** Redirect to login, refresh token if available
- **User Message:** "Session expired. Please log in again."

### 4.2 Connection Errors
- **Error:** Network unavailable, server down
- **Handling:** Show offline indicator, queue messages, auto-retry
- **User Message:** "Connection lost. Retrying..."

### 4.3 Message Send Errors
- **Error:** Message save failed, timeout, validation error
- **Handling:** Mark message as failed, allow manual retry
- **User Message:** "Failed to send. Tap to retry."

### 4.4 Duplicate Message Prevention
- **Error:** clientMessageId already exists
- **Handling:** Return existing message, don't create duplicate
- **User Message:** No error shown (transparent to user)

## 5. Performance Considerations

### 5.1 Message Batching
- Batch multiple typing events within 100ms window
- Reduce server load from rapid typing

### 5.2 Room Management
- Use Socket.IO rooms for efficient broadcasting
- Only broadcast to users in the conversation

### 5.3 Database Indexing
- Index on client_message_id for fast duplicate checks
- Index on conversationId + createdAt for message queries

### 5.4 Memory Management
- Limit in-memory message cache to 100 messages per conversation
- Paginate older messages on demand

## 6. Security Considerations

### 6.1 Authentication
- Validate JWT on every connection
- Reject expired or invalid tokens
- Use secure token storage on client

### 6.2 Authorization
- Verify user is participant before joining conversation
- Check permissions before broadcasting messages
- Validate conversationId exists and user has access

### 6.3 Input Validation
- Sanitize all text input to prevent XSS
- Validate message length (max 1000 characters)
- Rate limit message sending (10 messages/second per user)

### 6.4 Data Privacy
- Only send messages to authorized participants
- Don't leak user presence to non-participants
- Encrypt sensitive data in transit (WSS)

## 7. Testing Strategy

### 7.1 Unit Tests
- JWT authentication middleware
- Message deduplication logic
- Retry mechanism with exponential backoff
- Message queue management

### 7.2 Integration Tests
- End-to-end message flow
- Reconnection and sync
- Multiple clients in same conversation
- Offline message queueing

### 7.3 Property-Based Tests

**Property 1: Message Idempotency**
- **Statement:** Sending the same message multiple times (same clientMessageId) results in exactly one message in the database
- **Validates:** Requirements 2.4.3, 2.4.4, 2.4.5
- **Test:** Generate random messages with duplicate clientMessageIds, verify only one is saved

**Property 2: Message Ordering**
- **Statement:** Messages are always displayed in chronological order by createdAt timestamp
- **Validates:** Requirements 2.7.5
- **Test:** Send messages in random order, verify UI displays them sorted by timestamp

**Property 3: At-Least-Once Delivery**
- **Statement:** Every message sent eventually appears in the database (with retries)
- **Validates:** Requirements 3.3.1, 2.3.3
- **Test:** Simulate network failures, verify all messages eventually succeed or fail after max retries

**Property 4: No Message Loss on Reconnection**
- **Statement:** After reconnection, all messages sent during offline period are synced
- **Validates:** Requirements 2.7.1, 2.7.2
- **Test:** Disconnect client, send messages from other clients, reconnect, verify all messages appear

**Property 5: Typing Indicator Timeout**
- **Statement:** Typing indicator always disappears within 2 seconds of last keystroke
- **Validates:** Requirements 2.8.2
- **Test:** Simulate typing with random delays, verify indicator stops within 2s

**Property 6: Connection State Consistency**
- **Statement:** Connection state always matches actual socket state
- **Validates:** Requirements 2.2.3
- **Test:** Simulate various connection events, verify state updates correctly

**Property 7: Acknowledgment Timeout**
- **Statement:** Client always receives acknowledgment or timeout within 5 seconds
- **Validates:** Requirements 2.3.2
- **Test:** Send messages with simulated server delays, verify timeout fires at 5s

**Property 8: Exponential Backoff**
- **Statement:** Retry delays follow exponential backoff pattern (1s, 2s, 4s)
- **Validates:** Requirements 2.3.5, 2.6.5
- **Test:** Trigger retries, measure actual delays, verify they match expected pattern

## 8. Migration Plan

### Phase 1: Server-Side JWT Authentication
1. Add JWT middleware to Socket.IO server
2. Test authentication with existing HTTP JWT tokens
3. Deploy to staging

### Phase 2: Client-Side Socket.IO Hook
1. Create use-socket-io.ts hook
2. Implement connection management
3. Test connection lifecycle

### Phase 3: Message Acknowledgment
1. Add client_message_id to database
2. Implement retry logic on client
3. Implement deduplication on server
4. Test with network interruptions

### Phase 4: Optimistic UI
1. Update room-detail.tsx to use Socket.IO
2. Implement optimistic message rendering
3. Handle acknowledgments and errors
4. Test user experience

### Phase 5: Connection Resilience
1. Implement reconnection logic
2. Add offline message queue
3. Implement message sync
4. Test offline scenarios

### Phase 6: Additional Features
1. Implement typing indicators
2. Implement presence updates
3. Implement read receipts
4. Test all features together

### Phase 7: Remove HTTP Polling
1. Verify WebSocket stability
2. Remove polling code from client
3. Monitor for issues
4. Rollback plan if needed

## 9. Rollback Plan

If WebSocket implementation causes issues:

1. **Immediate:** Feature flag to disable WebSocket, fallback to HTTP polling
2. **Database:** client_message_id column is nullable, doesn't break existing code
3. **Client:** Keep HTTP polling code until WebSocket is proven stable
4. **Monitoring:** Track WebSocket connection success rate, message delivery latency

## 10. Success Metrics

- Message delivery latency < 500ms (p95)
- Connection success rate > 99%
- Reconnection time < 5 seconds (p95)
- Zero duplicate messages
- Zero message loss
- User satisfaction with real-time experience
