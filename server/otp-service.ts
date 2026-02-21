import { getDb } from "./db";
import { otpCodes, phoneVerifications, users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Generate random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Twilio Verify credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Send OTP to phone number using Twilio Verify API
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

  // Send SMS via Twilio Verify API (production-ready OTP service)
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID) {
    try {
      const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
      const params = new URLSearchParams();
      params.append('To', phoneNumber);
      params.append('Channel', 'sms');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json() as any;

      if (response.ok && data.status === 'pending') {
        console.log(`✅ [Twilio Verify] OTP sent to ${phoneNumber}, SID: ${data.sid}`);
      } else {
        console.error(`❌ [Twilio Verify] Failed: ${data.message || data.code}`);
        console.log(`📱 [OTP] FALLBACK - Code for ${phoneNumber}: ${otp}`);
      }
    } catch (error: any) {
      console.error(`❌ [Twilio Verify] Error:`, error.message);
      console.log(`📱 [OTP] FALLBACK - Code for ${phoneNumber}: ${otp}`);
    }
  } else {
    console.log(`📱 [OTP] TEST MODE - Code for ${phoneNumber}: ${otp}`);
  }

  return otp;
}

// Verify OTP code using Twilio Verify API
export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; userId?: number; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify with Twilio Verify API
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID) {
    try {
      const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
      const params = new URLSearchParams();
      params.append('To', phoneNumber);
      params.append('Code', code);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json() as any;

      if (!response.ok || data.status !== 'approved') {
        console.log(`❌ [Twilio Verify] Verification failed for ${phoneNumber}: ${data.status || data.message}`);
        return { success: false, message: "Invalid or expired OTP" };
      }

      console.log(`✅ [Twilio Verify] OTP verified for ${phoneNumber}`);
    } catch (error: any) {
      console.error(`❌ [Twilio Verify] Verification error:`, error.message);
      return { success: false, message: "OTP verification failed" };
    }
  } else {
    // Fallback to database verification (development mode)
    const otpRecord = await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.phoneNumber, phoneNumber))
      .limit(1);

    if (!otpRecord.length) {
      return { success: false, message: "OTP not found" };
    }

    const otp = otpRecord[0];

    if (new Date() > otp.expiresAt) {
      return { success: false, message: "OTP expired" };
    }

    if (otp.attempts >= otp.maxAttempts) {
      return { success: false, message: "Max attempts exceeded" };
    }

    if (otp.code !== code) {
      await db
        .update(otpCodes)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(otpCodes.id, otp.id));

      return { success: false, message: "Invalid OTP" };
    }

    await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, otp.id));
  }

  // Check if user already exists with this phone number
  const existingVerification = await db
    .select()
    .from(phoneVerifications)
    .where(eq(phoneVerifications.phoneNumber, phoneNumber))
    .limit(1);

  let user;
  
  if (existingVerification.length > 0) {
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

    await db.insert(userProfiles).values({
      userId: user[0].id,
      username: `user_${user[0].id}`,
      preferredLanguage: "tr",
      phoneNumber,
    });
  }

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

  const otpRecord = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.phoneNumber, phoneNumber))
    .limit(1);

  if (otpRecord.length && new Date() < otpRecord[0].expiresAt) {
    return otpRecord[0].code;
  }

  return sendOTP(phoneNumber);
}
