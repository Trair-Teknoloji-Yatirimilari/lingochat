import { getDb } from "./db";
import { otpCodes, phoneVerifications, users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// SMS Provider types
type SMSProvider = "twilio" | "netgsm" | "console";

// Get SMS provider from environment
const SMS_PROVIDER = (process.env.SMS_PROVIDER || "console") as SMSProvider;

// Twilio credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// NetGSM credentials
const NETGSM_USERNAME = process.env.NETGSM_USERNAME;
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD;
const NETGSM_HEADER = process.env.NETGSM_HEADER || "LINGOCHAT";

// Generate random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Twilio
async function sendViaTwilio(phoneNumber: string, message: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: phoneNumber,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio SMS failed: ${error}`);
  }

  console.log(`[OTP] SMS sent via Twilio to ${phoneNumber}`);
}

// Send SMS via NetGSM
async function sendViaNetGSM(phoneNumber: string, message: string): Promise<void> {
  if (!NETGSM_USERNAME || !NETGSM_PASSWORD) {
    throw new Error("NetGSM credentials not configured");
  }

  // NetGSM expects phone number without + prefix
  const cleanPhone = phoneNumber.replace(/^\+/, "");

  const url = "https://api.netgsm.com.tr/sms/send/get";
  const params = new URLSearchParams({
    usercode: NETGSM_USERNAME,
    password: NETGSM_PASSWORD,
    gsmno: cleanPhone,
    message: message,
    msgheader: NETGSM_HEADER,
    dil: "TR",
  });

  const response = await fetch(`${url}?${params.toString()}`);
  const result = await response.text();

  // NetGSM returns "00" or "01" for success, error codes otherwise
  if (!result.startsWith("00") && !result.startsWith("01")) {
    throw new Error(`NetGSM SMS failed: ${result}`);
  }

  console.log(`[OTP] SMS sent via NetGSM to ${phoneNumber}`);
}

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

  try {
    // Send SMS based on provider
    switch (SMS_PROVIDER) {
      case "twilio":
        await sendViaTwilio(phoneNumber, message);
        break;
      case "netgsm":
        await sendViaNetGSM(phoneNumber, message);
        break;
      case "console":
      default:
        console.log(`[OTP] TEST MODE - OTP ${otp} for ${phoneNumber}`);
        console.log(`[OTP] Message: ${message}`);
        break;
    }
  } catch (error) {
    console.error(`[OTP] Failed to send SMS:`, error);
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
