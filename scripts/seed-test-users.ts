import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, userProfiles } from "../drizzle/schema";
import "../scripts/load-env.js";

async function seedTestUsers() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("🌱 Seeding test users...");

  try {
    // Test User 1 - Turkish
    const testUser1 = await db
      .insert(users)
      .values({
        openId: "test_user_1_openid",
      })
      .onConflictDoNothing()
      .returning();

    if (testUser1.length > 0) {
      await db
        .insert(userProfiles)
        .values({
          userId: testUser1[0].id,
          username: "test_turkish",
          preferredLanguage: "tr",
          phoneNumber: "+905551234567",
        })
        .onConflictDoNothing();
      
      console.log("✅ Test User 1 created: @test_turkish (Turkish)");
    } else {
      console.log("ℹ️  Test User 1 already exists");
    }

    // Test User 2 - English
    const testUser2 = await db
      .insert(users)
      .values({
        openId: "test_user_2_openid",
      })
      .onConflictDoNothing()
      .returning();

    if (testUser2.length > 0) {
      await db
        .insert(userProfiles)
        .values({
          userId: testUser2[0].id,
          username: "test_english",
          preferredLanguage: "en",
          phoneNumber: "+15551234567",
        })
        .onConflictDoNothing();
      
      console.log("✅ Test User 2 created: @test_english (English)");
    } else {
      console.log("ℹ️  Test User 2 already exists");
    }

    // Test User 3 - Spanish
    const testUser3 = await db
      .insert(users)
      .values({
        openId: "test_user_3_openid",
      })
      .onConflictDoNothing()
      .returning();

    if (testUser3.length > 0) {
      await db
        .insert(userProfiles)
        .values({
          userId: testUser3[0].id,
          username: "test_spanish",
          preferredLanguage: "es",
          phoneNumber: "+34551234567",
        })
        .onConflictDoNothing();
      
      console.log("✅ Test User 3 created: @test_spanish (Spanish)");
    } else {
      console.log("ℹ️  Test User 3 already exists");
    }

    console.log("\n🎉 Test users seeded successfully!");
    console.log("\nYou can now search for:");
    console.log("  - @test_turkish (Türkçe)");
    console.log("  - @test_english (English)");
    console.log("  - @test_spanish (Español)");
    console.log("\nOr search by phone:");
    console.log("  - +905551234567");
    console.log("  - +15551234567");
    console.log("  - +34551234567");

  } catch (error) {
    console.error("❌ Error seeding test users:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTestUsers();
