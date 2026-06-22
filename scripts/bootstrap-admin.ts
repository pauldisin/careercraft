import dotenv from "dotenv";
dotenv.config();

import { db, users, sql } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import readline from "readline";
import { validatePassword } from "../src/lib/password-policy.ts";

// Parse CLI arguments manually to avoid extra dependencies
function getArg(name: string): string | null {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (arg) {
    return arg.split('=')[1];
  }
  return null;
}

// Readline helper for interactive CLI input
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function main() {
  console.log("=================================================");
  console.log("  👤 CareerCraft Admin Bootstrapper CLI 👤");
  console.log("=================================================\n");

  let email = getArg("email") || process.env.ADMIN_BOOTSTRAP_EMAIL;
  let password = getArg("password") || process.env.ADMIN_BOOTSTRAP_PASSWORD;
  let name = getArg("name") || process.env.ADMIN_BOOTSTRAP_NAME || "System Admin";

  // Prompt for email if not provided
  if (!email) {
    if (process.stdin.isTTY) {
      email = await askQuestion("Enter admin email address: ");
    } else {
      console.error("❌ Error: No email provided and stdin is non-TTY. Pass email via --email=<email> or ADMIN_BOOTSTRAP_EMAIL.");
      process.exit(1);
    }
  }

  if (!email || !email.includes("@")) {
    console.error("❌ Invalid or missing email address.");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUserRows = await db.select().from(users).where(eq(users.email, normalizedEmail));
  const existingUser = existingUserRows[0];

  if (existingUser) {
    console.log(`ℹ️  A user with the email '${normalizedEmail}' already exists (ID: ${existingUser.id}).`);
    
    let confirmPromote = getArg("promote") === "true" || !!process.env.ADMIN_BOOTSTRAP_PROMOTE;
    if (!confirmPromote && process.stdin.isTTY) {
      const answer = await askQuestion(`Would you like to promote this existing user to ADMIN status? (y/N): `);
      confirmPromote = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    }

    if (confirmPromote) {
      console.log(`Promoting user '${normalizedEmail}' to admin role...`);
      await db.update(users).set({ is_admin: 1 }).where(eq(users.id, existingUser.id));
      console.log(`\n🎉 SUCCESS: User '${normalizedEmail}' is now an Admin!`);
      
      if (sql && typeof sql.end === "function") {
        await sql.end();
      }
      process.exit(0);
    } else {
      console.log("❌ Bootstrapping aborted. Existing user was not modified.");
      if (sql && typeof sql.end === "function") {
        await sql.end();
      }
      process.exit(1);
    }
  }

  // If user doesn't exist, we must have a password to create them
  if (!password) {
    // Generate a secure temporary password if we're non-interactive, or prompt
    if (!process.stdin.isTTY) {
      // Create a highly complex automatic password
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const digits = "0123456789";
      const specials = "!@#$%^&*()_+~}{[]:;?><,./-=";
      const getRand = (pool: string) => pool[crypto.randomInt(pool.length)];
      password = 
        getRand(upper) + getRand(upper) +
        getRand(lower) + getRand(lower) +
        getRand(digits) + getRand(digits) +
        getRand(specials) + getRand(specials) +
        crypto.randomBytes(4).toString("hex"); // Ensure length >= 12 and guaranteed complexity
      console.log(`⚠️  No password provided. Generated secure temporary compliant password: ${password}`);
    } else {
      password = await askQuestion("Enter password for new admin account (min 12 chars, mixed case, numbers, special symbol): ");
    }
  }

  const policyCheck = validatePassword(password, true);
  if (!policyCheck.valid) {
    console.error(`❌ STRENGTH ERROR: ${policyCheck.message}`);
    if (sql && typeof sql.end === "function") {
      await sql.end();
    }
    process.exit(1);
  }

  console.log(`Creating a brand new admin user: ${normalizedEmail}...`);

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const referralCode = crypto.randomBytes(4).toString('hex');

  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    password_hash: passwordHash,
    name: name,
    is_admin: 1,
    subscription_status: 'active',
    subscription_plan: 'lifetime',
    credits: 9999,
    created_at: new Date(),
    referral_code: referralCode,
  });

  console.log("\n=================================================");
  console.log("             🎉 ACCOUNT CREATED Successfully!    ");
  console.log("=================================================");
  console.log(`  ID:       ${userId}`);
  console.log(`  Email:    ${normalizedEmail}`);
  console.log(`  Name:     ${name}`);
  console.log(`  Role:     ADMIN (is_admin: 1)`);
  if (!getArg("password") && !process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    console.log(`  Password: ${password}`);
    console.log("  ⚠️  MAKE SURE TO SECURELY SAVE THIS PASSWORD!");
  } else {
    console.log(`  Password: [As configured]`);
  }
  console.log("=================================================\n");

  if (sql && typeof sql.end === "function") {
    await sql.end();
  }
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Runtime bootstrapper error:", err);
  if (sql && typeof sql.end === "function") {
    try {
      await sql.end();
    } catch {}
  }
  process.exit(1);
});
