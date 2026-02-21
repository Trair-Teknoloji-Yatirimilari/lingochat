import { getDb } from "./db";
import { otpCodes, phoneVerifications, users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// SMS Provider types
type SMSProvider = "twilio" | "netgsm" | "console";

// SMS Provider interface
interface SMSProviderInterface {
  sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Generate random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Twilio SMS Provider - Production ready implementation
 */
class TwilioSMSProvider implements SMSProviderInterface {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string | null;
  private messagingServiceSid: string | null;

  constructor(
    accountSid: string,
    authToken: string,
    fromNumber?: string,
    messagingServiceSid?: string
  ) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber || null;
    this.messagingServiceSid = messagingServiceSid || null;

    console.log("[Twilio] Initialized");
    if (this.messagingServiceSid) {
      console.log("[Twilio] Using Messaging Service:", this.messagingServiceSid);
    } else if (this.fromNumber) {
      console.log("[Twilio] Using From number:", this.fromNumber);
    }
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      // Prepare form data
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('Body', message);

      // Use Messaging Service for better delivery (same routing as Safely)
      if (this.messagingServiceSid) {
        params.append('MessagingServiceSid', this.messagingServiceSid);
      } else if (this.fromNumber) {
        params.append('From', this.fromNumber);
      } else {
        return { success: false, error: 'Neither MessagingServiceSid nor From number configured' };
      }

      // Make API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json() as any;

      if (response.ok) {
        console.log(`✅ [Twilio] SMS sent successfully to ${to}, SID: ${data.sid}`);
        return { success: true, messageId: data.sid };
      } else {
        console.error(`❌ [Twilio] SMS failed: ${data.message}`);
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Twilio] SMS error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * NetGSM SMS Provider
 */
class NetgsmSMSProvider implements SMSProviderInterface {
  private username: string;
  private password: string;
  private header: string;

  constructor(username: string, password: string, header: string) {
    this.username = username;
    this.password = password;
    this.header = header;
    console.log("[NetGSM] Initialized");
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // NetGSM expects phone number without + prefix
      const cleanNumber = to.replace(/^\+/, '');

      const url = 'https://api.netgsm.com.tr/sms/send/get';
      const params = new URLSearchParams({
        usercode: this.username,
        password: this.password,
        gsmno: cleanNumber,
        message: message,
        msgheader: this.header,
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
      });

      const responseText = await response.text();

      // NetGSM returns "00" or "01" for success
      if (responseText.startsWith('00') || responseText.startsWith('01')) {
        const messageId = responseText.split(' ')[1] || responseText;
        console.log(`✅ [NetGSM] SMS sent successfully to ${to}, ID: ${messageId}`);
        return { success: true, messageId };
      } else {
        const errorMap: { [key: string]: string } = {
          '20': 'Invalid message content',
          '30': 'Invalid username or password',
          '40': 'Invalid message header',
          '50': 'Invalid phone number',
          '51': 'Insufficient credits',
          '70': 'Invalid parameters',
        };
        const error = errorMap[responseText] || `NetGSM error code: ${responseText}`;
        console.error(`❌ [NetGSM] SMS failed: ${error}`);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [NetGSM] SMS error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * Mock SMS Provider for development
 */
class MockSMSProvider implements SMSProviderInterface {
  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`📨 [MOCK SMS] To: ${to}`);
    console.log(`📨 [MOCK SMS] Message: ${message}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { success: true, messageId };
  }
}

/**
 * Initialize SMS provider based on environment configuration
 */
function initializeSMSProvider(): SMSProviderInterface {
  const providerType = (process.env.SMS_PROVIDER || "console") as SMSProvider;

  switch (providerType.toLowerCase()) {
    case 'twilio': {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
      const twilioMsgSvcSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      if (!twilioSid || !twilioToken) {
        console.warn('⚠️  Twilio credentials not configured, falling back to mock provider');
        return new MockSMSProvider();
      }

      console.log('📱 SMS Service initialized with Twilio provider');
      return new TwilioSMSProvider(twilioSid, twilioToken, twilioNumber, twilioMsgSvcSid);
    }

    case 'netgsm': {
      const netgsmUser = process.env.NETGSM_USERNAME;
      const netgsmPass = process.env.NETGSM_PASSWORD;
      const netgsmHeader = process.env.NETGSM_HEADER || 'LINGOCHAT';

      if (!netgsmUser || !netgsmPass) {
        console.warn('⚠️  NetGSM credentials not configured, falling back to mock provider');
        return new MockSMSProvider();
      }

      console.log('📱 SMS Service initialized with NetGSM provider');
      return new NetgsmSMSProvider(netgsmUser, netgsmPass, netgsmHeader);
    }

    case 'console':
    default:
      console.log('📱 SMS Service initialized with Mock provider (development mode)');
      return new MockSMSProvider();
  }
}

// Initialize provider once
const smsProvider = initializeSMSProvider();

// Send OTP to phone number
export async function sendOTP(phoneNumber: string): Promise<string> {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete previous OTP codes for this phone number
  await db.delete(otpCodes).where(eq(otpCodes.phoneNumber, phoneNumber));

  // Create new OTP code
  await db.insert(otpCodes).values({
    phoneNumber,
    code: otp,
    expiresAt,
  });

  // Prepare SMS message
  const message = `LingoChat verification code: ${otp}. Valid for 10 minutes.`;

  // Send SMS using provider
  const result = await smsProvider.sendSMS(phoneNumber, message);

  if (!result.success) {
    console.error(`[OTP] Failed to send SMS: ${result.error}`);
    // In case of SMS failure, still log to console for testing
    console.log(`[OTP] FALLBACK - OTP ${otp} for ${phoneNumber}`);
  }

  return otp;
}

// Verify OTP code
export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; userId?: number; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find OTP code
  const otpRecord = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.phoneNumber, phoneNumber))
    .limit(1);

  if (!otpRecord.length) {
    return { success: false, message: "OTP not found" };
  }

  const otp = otpRecord[0];

  // Check if OTP is expired
  if (new Date() > otp.expiresAt) {
    return { success: false, message: "OTP expired" };
  }

  // Check if max attempts exceeded
  if (otp.attempts >= otp.maxAttempts) {
    return { success: false, message: "Max attempts exceeded" };
  }

  // Check if code matches
  if (otp.code !== code) {
    // Increment attempts
    await db
      .update(otpCodes)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpCodes.id, otp.id));

    return { success: false, message: "Invalid OTP" };
  }

  // Mark OTP as verified
  await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, otp.id));

  // Check if user already exists with this phone number
  // First check phoneVerifications table
  const existingVerification = await db
    .select()
    .from(phoneVerifications)
    .where(eq(phoneVerifications.phoneNumber, phoneNumber))
    .limit(1);

  let user;
  
  if (existingVerification.length > 0) {
    // User exists, get user by ID
    const existingUserId = existingVerification[0].userId;
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, existingUserId))
      .limit(1);
    
    if (existingUser.length > 0) {
      user = existingUser;
      console.log(`[OTP] Existing user found: ${user[0].id}`);
    }
  }

  // If no user found, check by email (phone number stored as email)
  if (!user) {
    const userByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, phoneNumber))
      .limit(1);
    
    if (userByEmail.length > 0) {
      user = userByEmail;
      console.log(`[OTP] User found by email: ${user[0].id}`);
    }
  }

  // If still no user, create new one
  if (!user) {
    console.log(`[OTP] Creating new user for: ${phoneNumber}`);
    const newUserResult = await db
      .insert(users)
      .values({
        openId: `phone_${phoneNumber.replace(/\+/g, '')}`,
        email: phoneNumber,
        name: phoneNumber,
        loginMethod: "phone-otp",
      })
      .returning();

    user = newUserResult;

    // Create user profile with default username
    await db.insert(userProfiles).values({
      userId: user[0].id,
      username: `user_${user[0].id}`,
      preferredLanguage: "tr",
      phoneNumber,
    });
  }

  // Update or create phone verification record
  await db
    .insert(phoneVerifications)
    .values({
      userId: user[0].id,
      phoneNumber,
      countryCode: phoneNumber.substring(0, 3),
      isVerified: true,
      verifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: phoneVerifications.phoneNumber,
      set: {
        isVerified: true,
        verifiedAt: new Date(),
        userId: user[0].id,
      },
    });

  return { success: true, userId: user[0].id, message: "OTP verified successfully" };
}

// Resend OTP
export async function resendOTP(phoneNumber: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if previous OTP is still valid
  const otpRecord = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.phoneNumber, phoneNumber))
    .limit(1);

  if (otpRecord.length && new Date() < otpRecord[0].expiresAt) {
    // Return existing OTP if still valid
    return otpRecord[0].code;
  }

  // Send new OTP
  return sendOTP(phoneNumber);
}
