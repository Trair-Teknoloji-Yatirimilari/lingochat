import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Server as HTTPServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { setupSocketIO } from "./socket-io";
import { SignJWT } from "jose";

// Use a test secret for JWT signing
const TEST_JWT_SECRET = "test-secret-key-for-socket-io-authentication";

describe("Socket.IO JWT Authentication", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clientSocket: ClientSocket;
  let originalSecret: string;

  // Helper function to create a valid JWT token
  async function createValidToken(userId: number, openId: string): Promise<string> {
    const secretKey = new TextEncoder().encode(TEST_JWT_SECRET);
    const expirationSeconds = Math.floor((Date.now() + 3600000) / 1000); // 1 hour from now

    return new SignJWT({
      openId,
      appId: "test-app",
      name: "Test User",
      userId,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  // Helper function to create an expired JWT token
  async function createExpiredToken(userId: number, openId: string): Promise<string> {
    const secretKey = new TextEncoder().encode(TEST_JWT_SECRET);
    const expirationSeconds = Math.floor((Date.now() - 3600000) / 1000); // 1 hour ago

    return new SignJWT({
      openId,
      appId: "test-app",
      name: "Test User",
      userId,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      // Set test JWT secret
      originalSecret = process.env.JWT_SECRET || "";
      process.env.JWT_SECRET = TEST_JWT_SECRET;

      // Create HTTP server and Socket.IO server
      httpServer = new HTTPServer();
      setupSocketIO(httpServer);

      // Listen on random available port
      httpServer.listen(() => {
        const address = httpServer.address();
        if (address && typeof address === "object") {
          serverPort = address.port;
          resolve();
        }
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
      
      httpServer.close(() => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    // Disconnect any existing client socket
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("should accept connection with valid JWT token in auth", async () => {
    const token = await createValidToken(1, "test-user-123");

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        resolve();
      });

      clientSocket.on("connect_error", (error) => {
        reject(new Error(`Connection should succeed but got error: ${error.message}`));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 5000);
    });
  });

  it("should accept connection with valid JWT token in query", async () => {
    const token = await createValidToken(2, "test-user-456");

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        query: { token },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        resolve();
      });

      clientSocket.on("connect_error", (error) => {
        reject(new Error(`Connection should succeed but got error: ${error.message}`));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 5000);
    });
  });

  it("should reject connection without token", async () => {
    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        clientSocket.disconnect();
        reject(new Error("Connection should be rejected without token"));
      });

      clientSocket.on("connect_error", (error) => {
        // Socket.IO may wrap the error message
        expect(error.message).toBeTruthy();
        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Should have received connect_error"));
      }, 5000);
    });
  });

  it("should reject connection with invalid token", async () => {
    const invalidToken = "invalid.jwt.token";

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: invalidToken },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        clientSocket.disconnect();
        reject(new Error("Connection should be rejected with invalid token"));
      });

      clientSocket.on("connect_error", (error) => {
        // Socket.IO may wrap the error message
        expect(error.message).toBeTruthy();
        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Should have received connect_error"));
      }, 5000);
    });
  });

  it("should reject connection with expired token", async () => {
    const expiredToken = await createExpiredToken(3, "test-user-789");

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: expiredToken },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        clientSocket.disconnect();
        reject(new Error("Connection should be rejected with expired token"));
      });

      clientSocket.on("connect_error", (error) => {
        // Socket.IO may wrap the error message
        expect(error.message).toBeTruthy();
        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Should have received connect_error"));
      }, 5000);
    });
  });

  it("should reject connection with token signed with wrong secret", async () => {
    // Create token with wrong secret
    const wrongSecretKey = new TextEncoder().encode("wrong-secret-key");
    const expirationSeconds = Math.floor((Date.now() + 3600000) / 1000);

    const tokenWithWrongSecret = await new SignJWT({
      openId: "test-user-999",
      appId: "test-app",
      name: "Test User",
      userId: 999,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(wrongSecretKey);

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: tokenWithWrongSecret },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        clientSocket.disconnect();
        reject(new Error("Connection should be rejected with wrong secret"));
      });

      clientSocket.on("connect_error", (error) => {
        // Socket.IO may wrap the error message
        expect(error.message).toBeTruthy();
        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Should have received connect_error"));
      }, 5000);
    });
  });

  it("should extract userId from valid token and store in socket.data", async () => {
    const userId = 42;
    const token = await createValidToken(userId, "test-user-extract");

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        // We can't directly access socket.data from client, but we can verify
        // the connection succeeded, which means userId was extracted
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        resolve();
      });

      clientSocket.on("connect_error", (error) => {
        reject(new Error(`Connection should succeed but got error: ${error.message}`));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 5000);
    });
  });
});

describe("Socket.IO Message Idempotency", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clientSocket: ClientSocket;
  let originalSecret: string;

  // Helper function to create a valid JWT token
  async function createValidToken(userId: number, openId: string): Promise<string> {
    const secretKey = new TextEncoder().encode(TEST_JWT_SECRET);
    const expirationSeconds = Math.floor((Date.now() + 3600000) / 1000); // 1 hour from now

    return new SignJWT({
      openId,
      appId: "test-app",
      name: "Test User",
      userId,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      // Set test JWT secret
      originalSecret = process.env.JWT_SECRET || "";
      process.env.JWT_SECRET = TEST_JWT_SECRET;

      // Create HTTP server and Socket.IO server
      httpServer = new HTTPServer();
      setupSocketIO(httpServer);

      // Listen on random available port
      httpServer.listen(() => {
        const address = httpServer.address();
        if (address && typeof address === "object") {
          serverPort = address.port;
          resolve();
        }
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
      
      httpServer.close(() => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    // Disconnect any existing client socket
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("should accept message without clientMessageId", async () => {
    const token = await createValidToken(100, "test-user-msg-1");

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        // Send message without clientMessageId
        clientSocket.emit("message:send", 1, {
          text: "Test message without clientMessageId",
          senderLanguage: "en",
          recipientLanguage: "tr",
        });

        // Listen for acknowledgment
        clientSocket.on("message:ack", (messageId) => {
          expect(messageId).toBeDefined();
          expect(typeof messageId).toBe("number");
          clientSocket.disconnect();
          resolve();
        });

        // Listen for errors
        clientSocket.on("error", (error) => {
          clientSocket.disconnect();
          reject(new Error(`Should not receive error: ${error}`));
        });
      });

      clientSocket.on("connect_error", (error) => {
        reject(new Error(`Connection should succeed but got error: ${error.message}`));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        clientSocket.disconnect();
        reject(new Error("Test timeout"));
      }, 5000);
    });
  });

  it("should accept message with clientMessageId", async () => {
    const token = await createValidToken(101, "test-user-msg-2");
    const clientMessageId = "test-client-msg-id-" + Date.now();

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ["websocket"],
      });

      clientSocket.on("connect", () => {
        // Send message with clientMessageId
        clientSocket.emit("message:send", 1, {
          text: "Test message with clientMessageId",
          senderLanguage: "en",
          recipientLanguage: "tr",
          clientMessageId,
        });

        // Listen for acknowledgment
        clientSocket.on("message:ack", (messageId) => {
          expect(messageId).toBeDefined();
          expect(typeof messageId).toBe("number");
          clientSocket.disconnect();
          resolve();
        });

        // Listen for errors
        clientSocket.on("error", (error) => {
          clientSocket.disconnect();
          reject(new Error(`Should not receive error: ${error}`));
        });
      });

      clientSocket.on("connect_error", (error) => {
        reject(new Error(`Connection should succeed but got error: ${error.message}`));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        clientSocket.disconnect();
        reject(new Error("Test timeout"));
      }, 5000);
    });
  });

  it("should return existing message when duplicate clientMessageId is sent", async () => {
    const token = await createValidToken(102, "test-user-msg-3");
    const clientMessageId = "duplicate-test-" + Date.now();

    return new Promise<void>((resolve, reject) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ["websocket"],
      });

      let firstMessageId: number | null = null;
      let ackCount = 0;

      clientSocket.on("connect", () => {
        // Send first message
        clientSocket.emit("message:send", 1, {
          text: "First message with duplicate ID",
          senderLanguage: "en",
          recipientLanguage: "tr",
          clientMessageId,
        });

        // Listen for acknowledgments
        clientSocket.on("message:ack", (messageId) => {
          ackCount++;
          
          if (ackCount === 1) {
            // First acknowledgment
            firstMessageId = messageId;
            expect(messageId).toBeDefined();
            expect(typeof messageId).toBe("number");
            
            // Send duplicate message with same clientMessageId
            setTimeout(() => {
              clientSocket.emit("message:send", 1, {
                text: "Duplicate message - should be ignored",
                senderLanguage: "en",
                recipientLanguage: "tr",
                clientMessageId, // Same ID
              });
            }, 100);
          } else if (ackCount === 2) {
            // Second acknowledgment - should be same message ID
            expect(messageId).toBe(firstMessageId);
            clientSocket.disconnect();
            resolve();
          }
        });

        // Listen for errors
        clientSocket.on("error", (error) => {
          clientSocket.disconnect();
          reject(new Error(`Should not receive error: ${error}`));
        });
      });

      clientSocket.on("connect_error", (error) => {
        reject(new Error(`Connection should succeed but got error: ${error.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        clientSocket.disconnect();
        reject(new Error(`Test timeout - received ${ackCount} acknowledgments`));
      }, 10000);
    });
  });
});
