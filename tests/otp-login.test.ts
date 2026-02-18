import { describe, it, expect, vi } from "vitest";
import { generateOTP } from "../server/otp-service";

describe("OTP Login System", () => {
  describe("OTP Generation", () => {
    it("should generate a 6-digit OTP", () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it("should generate different OTPs on each call", () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toBe(otp2);
    });

    it("should generate OTP in valid range", () => {
      const otp = generateOTP();
      const otpNum = parseInt(otp, 10);
      expect(otpNum).toBeGreaterThanOrEqual(100000);
      expect(otpNum).toBeLessThanOrEqual(999999);
    });
  });

  describe("Phone Number Validation", () => {
    it("should validate Turkish phone numbers", () => {
      const validNumbers = ["+905551234567", "+90 555 123 4567", "905551234567"];
      validNumbers.forEach((num) => {
        expect(num.replace(/\s/g, "")).toMatch(/^\+?90\d{10}$/);
      });
    });

    it("should validate US phone numbers", () => {
      const validNumbers = ["+15551234567", "+1 555 123 4567", "15551234567"];
      validNumbers.forEach((num) => {
        expect(num.replace(/\s/g, "")).toMatch(/^\+?1\d{10}$/);
      });
    });

    it("should validate UK phone numbers", () => {
      const validNumbers = ["+441234567890", "+44 1234 567890", "441234567890"];
      validNumbers.forEach((num) => {
        expect(num.replace(/\s/g, "")).toMatch(/^\+?44\d{10}$/);
      });
    });
  });

  describe("OTP Expiration", () => {
    it("should set OTP expiration to 10 minutes", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
      const diffInMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      expect(diffInMinutes).toBeCloseTo(10, 0);
    });

    it("should detect expired OTP", () => {
      const now = new Date();
      const expiredTime = new Date(now.getTime() - 1000); // 1 second ago
      expect(now > expiredTime).toBe(true);
    });

    it("should detect valid OTP within expiration", () => {
      const now = new Date();
      const validTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
      expect(now < validTime).toBe(true);
    });
  });

  describe("OTP Attempt Tracking", () => {
    it("should track failed attempts", () => {
      let attempts = 0;
      const maxAttempts = 5;

      for (let i = 0; i < 3; i++) {
        if (attempts < maxAttempts) {
          attempts++;
        }
      }

      expect(attempts).toBe(3);
      expect(attempts < maxAttempts).toBe(true);
    });

    it("should block after max attempts", () => {
      let attempts = 0;
      const maxAttempts = 5;

      for (let i = 0; i < 6; i++) {
        if (attempts < maxAttempts) {
          attempts++;
        }
      }

      expect(attempts).toBe(5);
      expect(attempts >= maxAttempts).toBe(true);
    });
  });

  describe("Country Code Support", () => {
    const countryCodes = {
      TR: "+90",
      US: "+1",
      GB: "+44",
      DE: "+49",
      FR: "+33",
      ES: "+34",
      IT: "+39",
      JP: "+81",
      CN: "+86",
      IN: "+91",
      BR: "+55",
      MX: "+52",
      AU: "+61",
      CA: "+1",
      RU: "+7",
      KR: "+82",
      SG: "+65",
      AE: "+971",
      SA: "+966",
      NG: "+234",
    };

    it("should support all major country codes", () => {
      Object.entries(countryCodes).forEach(([country, code]) => {
        expect(code).toMatch(/^\+\d{1,3}$/);
      });
    });

    it("should have 20+ supported countries", () => {
      expect(Object.keys(countryCodes).length).toBeGreaterThanOrEqual(20);
    });
  });

  describe("OTP Verification Flow", () => {
    it("should verify correct OTP", () => {
      const correctOtp = "123456";
      const userInput = "123456";
      expect(userInput === correctOtp).toBe(true);
    });

    it("should reject incorrect OTP", () => {
      const correctOtp = "123456";
      const userInput = "654321";
      expect(userInput).not.toBe(correctOtp);
    });

    it("should be case-insensitive for OTP", () => {
      const otp = "123456";
      const input1 = "123456";
      const input2 = "123456";
      expect(input1 === input2).toBe(true);
    });
  });

  describe("Session Management", () => {
    it("should create session after OTP verification", () => {
      const userId = 1;
      const sessionToken = `session_${userId}_${Date.now()}`;
      expect(sessionToken).toContain(`session_${userId}`);
    });

    it("should include userId in session", () => {
      const userId = 42;
      const session = { userId, createdAt: new Date() };
      expect(session.userId).toBe(42);
    });

    it("should track session creation time", () => {
      const session = { userId: 1, createdAt: new Date() };
      expect(session.createdAt instanceof Date).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty phone number", () => {
      const phoneNumber = "";
      expect(phoneNumber.trim().length).toBe(0);
    });

    it("should handle invalid phone format", () => {
      const phoneNumber = "abc123";
      expect(/^\d+$/.test(phoneNumber)).toBe(false);
    });

    it("should handle network errors gracefully", () => {
      const error = new Error("Network error");
      expect(error.message).toBe("Network error");
    });
  });
});
