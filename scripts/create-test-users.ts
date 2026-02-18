import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, userProfiles, conversations } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function createTestUsers() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log("Creating test users...");

  // Test User 1
  const user1Result = await db
    .insert(users)
    .values({
      openId: "test-user-1-openid",
      name: "Ahmet Yilmaz",
      email: "ahmet@example.com",
      loginMethod: "test",
    })
    .returning();

  const user1 = user1Result[0];
  console.log("✓ Created user 1:", user1.email);

  // Create profile for user 1
  await db.insert(userProfiles).values({
    userId: user1.id,
    username: "ahmet_yilmaz",
    preferredLanguage: "tr",
  });
  console.log("✓ Created profile for user 1 (Turkish)");

  // Test User 2
  const user2Result = await db
    .insert(users)
    .values({
      openId: "test-user-2-openid",
      name: "John Smith",
      email: "john@example.com",
      loginMethod: "test",
    })
    .returning();

  const user2 = user2Result[0];
  console.log("✓ Created user 2:", user2.email);

  // Create profile for user 2
  await db.insert(userProfiles).values({
    userId: user2.id,
    username: "john_smith",
    preferredLanguage: "en",
  });
  console.log("✓ Created profile for user 2 (English)");

  // Test User 3
  const user3Result = await db
    .insert(users)
    .values({
      openId: "test-user-3-openid",
      name: "Maria Garcia",
      email: "maria@example.com",
      loginMethod: "test",
    })
    .returning();

  const user3 = user3Result[0];
  console.log("✓ Created user 3:", user3.email);

  // Create profile for user 3
  await db.insert(userProfiles).values({
    userId: user3.id,
    username: "maria_garcia",
    preferredLanguage: "es",
  });
  console.log("✓ Created profile for user 3 (Spanish)");

  // Create conversation between user 1 and user 2
  await db
    .insert(conversations)
    .values({
      participant1Id: user1.id,
      participant2Id: user2.id,
    })
    .returning();

  console.log("✓ Created conversation between user 1 and user 2");

  console.log("\n=== Test Users Created Successfully ===");
  console.log("\nTest User Credentials:");
  console.log("User 1: ahmet@example.com (Turkish)");
  console.log("User 2: john@example.com (English)");
  console.log("User 3: maria@example.com (Spanish)");
  console.log("\nConversation created between User 1 and User 2");
  console.log("\nYou can now test the app with these users!");

  await client.end();
}

createTestUsers().catch((error) => {
  console.error("Error creating test users:", error);
  process.exit(1);
});
