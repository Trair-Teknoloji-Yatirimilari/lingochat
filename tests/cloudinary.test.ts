import { describe, it, expect } from "vitest";
import { v2 as cloudinary } from "cloudinary";

describe("Cloudinary Configuration", () => {
  it("should have valid Cloudinary credentials", () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    expect(cloudName).toBeDefined();
    expect(apiKey).toBeDefined();
    expect(apiSecret).toBeDefined();

    expect(cloudName).toBe("dzolony1r");
    expect(apiKey).toBe("462145516773453");
    expect(apiSecret).toBe("bCVqyqzRggZvwz_sollVmXHmLOo");
  });

  it("should configure cloudinary with correct credentials", () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    expect(cloudinary.config().cloud_name).toBe("dzolony1r");
    expect(cloudinary.config().api_key).toBe("462145516773453");
  });

  it("should generate valid upload signature", () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    expect(signature).toBeDefined();
    expect(typeof signature).toBe("string");
    expect(signature.length).toBeGreaterThan(0);
  });
});
