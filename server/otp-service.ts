import { getDb } from "./db";
import { otpCodes, phoneVerifications, users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Generate random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to phone number (mock implementation)
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

  // In production, send via SMS service (Twilio, AWS SNS, etc.)
  console.log(`[OTP] Sending OTP ${otp} to ${phoneNumber}`);

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
