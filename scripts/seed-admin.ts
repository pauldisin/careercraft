import { db, users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function main() {
  console.log("=================================================");
  console.log("  👤 Seeding/Verifying Admin Account 👤");
  console.log("=================================================\n");

  const adminEmail = "admin@careercraft.com";
  // As requested by user: CareerAdmin#2026
  const adminPassword = "CareerAdmin#2026";
  const adminName = "System Administrator";

  const normalizedEmail = adminEmail.trim().toLowerCase();

  // Check if user already exists
  const existingUserRows = await db.select().from(users).where(eq(users.email, normalizedEmail));
  const existingUser = existingUserRows[0];

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  if (existingUser) {
    console.log(`ℹ️  A user with the email '${normalizedEmail}' already exists (ID: ${existingUser.id}).`);
    console.log(`Updating user to ensure admin role, active lifetime membership, and the exact password...`);
    
    await db.update(users).set({
      is_admin: 1,
      password_hash: passwordHash,
      name: adminName,
      subscription_status: 'active',
      subscription_plan: 'lifetime',
      credits: 9999,
      is_suspended: 0,
    }).where(eq(users.id, existingUser.id));

    console.log(`\n🎉 SUCCESS: Admin user '${normalizedEmail}' updated successfully!`);
  } else {
    console.log(`Creating a brand new admin user: ${normalizedEmail}...`);
    const userId = crypto.randomUUID();
    const referralCode = crypto.randomBytes(4).toString('hex');

    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      password_hash: passwordHash,
      name: adminName,
      is_admin: 1,
      subscription_status: 'active',
      subscription_plan: 'lifetime',
      credits: 9999,
      referral_code: referralCode,
      is_suspended: 0,
    });

    console.log(`\n🎉 SUCCESS: Admin user '${normalizedEmail}' created successfully!`);
  }

  // Double check query to verify
  const checkRows = await db.select().from(users).where(eq(users.email, normalizedEmail));
  console.log("Verified database status:", JSON.stringify(checkRows[0], null, 2));

  console.log("\n=================================================");
  console.log("             🎉 OPERATION COMPLETE!             ");
  console.log("=================================================\n");
  
  // Safe exit
  process.exit(0);
}

main().catch((err) => {
  console.error("Runtime error seeding admin:", err);
  process.exit(1);
});
