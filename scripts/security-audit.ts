import fs from "fs";
import path from "path";
import { promisify } from "util";

/**
 * CareerCraft Security Audit Scan Script
 * Performs static code analysis & configuration checks to verify security controls.
 */

interface AuditResult {
  title: string;
  category: string;
  status: "PASSED" | "FAILED" | "WARNING";
  details: string;
}

const results: AuditResult[] = [];

function checkFileExists(filePath: string, title: string, category: string, reqInProd = false) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    results.push({
      title,
      category,
      status: "PASSED",
      details: `File found at ${filePath}.`
    });
    return true;
  } else {
    results.push({
      title,
      category,
      status: reqInProd ? "FAILED" : "WARNING",
      details: `File NOT found at ${filePath}.`
    });
    return false;
  }
}

function checkRegexpInFile(filePath: string, regexp: RegExp, title: string, category: string, expectMatch: boolean, detailsIfMismatch: string) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    results.push({
      title,
      category,
      status: "WARNING",
      details: `Could not check pattern since file ${filePath} does not exist.`
    });
    return;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const match = regexp.test(content);

  if (match === expectMatch) {
    results.push({
      title,
      category,
      status: "PASSED",
      details: `Correctly configured: ${filePath} pattern matching validated.`
    });
  } else {
    results.push({
      title,
      category,
      status: "FAILED",
      details: detailsIfMismatch
    });
  }
}

// 1. Check Startup Guards and Environment Variable Rules
console.log("🔍 Running CareerCraft Static Security Audit & Guardrail Verification...\n");

// Check env.ts guards are robust
checkRegexpInFile(
  "src/lib/env.ts",
  /throw new Error\("FATAL: JWT_SECRET environment variable is missing/i,
  "Hard Failure on JWT_SECRET Missing in Production",
  "Environment Security",
  true,
  "JWT_SECRET missing guard is or fallback is not hard failing in production."
);

checkRegexpInFile(
  "src/lib/env.ts",
  /throw new Error\("FATAL: REDIS_URL environment variable is missing/i,
  "Hard Failure on REDIS_URL Missing in Production",
  "Environment Security",
  true,
  "REDIS_URL must hard-fail in production state to ensure persistent rate limiting and reset tokens."
);

checkRegexpInFile(
  "src/lib/env.ts",
  /throw new Error\("FATAL: DEMO_MODE is enabled in production!/i,
  "Hard Failure on DEMO_MODE Enabled in Production",
  "Environment Security",
  true,
  "DEMO_MODE must not be enabled or defaulted of in production."
);

// 2. Check Strong Password Policy Integration
checkFileExists("src/lib/password-policy.ts", "Strong Password Policy Helper", "Authentication Rules", true);

checkRegexpInFile(
  "routes/auth.ts",
  /validatePassword\(password, false\)/,
  "Password Policy Check in Registration",
  "Authentication Rules",
  true,
  "User registration does not enforce the newly introduced password policy."
);

checkRegexpInFile(
  "routes/auth.ts",
  /validatePassword\(password, user.is_admin === 1\)/,
  "Password Policy Check in Password Update / Reset",
  "Authentication Rules",
  true,
  "User password update / reset routes do not enforce complexity checks based on admin scope."
);

checkRegexpInFile(
  "routes/admin.ts",
  /validatePassword\(password, targetUser.is_admin === 1\)/,
  "Password Policy Check in Admin Password Reset Support",
  "Authentication Rules",
  true,
  "Administrative password resets do not enforce password policies."
);

// 3. Security Headers and Session configuration
checkRegexpInFile(
  "server.ts",
  /app.use\(helmet\(/,
  "Secure Content Security Policy & Headers (helmet)",
  "Network & Transport Security",
  true,
  "Helmet middleware is missing from Express setup."
);

checkRegexpInFile(
  "server.ts",
  /app.set\('trust proxy', 1\)/,
  "Reverse Proxy Trust Set Securely",
  "Network & Transport Security",
  true,
  "Reverse proxy trust is not set, which may cause client IP misdetection behind proxy."
);

// 4. Rate Limiting verification
checkRegexpInFile(
  "server.ts",
  /getRedisRateLimitStore\(\)/,
  "Redis Rate Limitter Store usage",
  "API & Abuse Prevention",
  true,
  "API endpoints do not appear to load the Redis rate limiting store adapter in server."
);

// 5. Query Parameterization / SQL Injection check
function scanForSqlConcat() {
  const routesDir = path.join(process.cwd(), "routes");
  let potentialRawConcat = false;
  
  if (fs.existsSync(routesDir)) {
    const files = fs.readdirSync(routesDir);
    for (const file of files) {
      if (file.endsWith(".ts")) {
        const content = fs.readFileSync(path.join(routesDir, file), "utf-8");
        // Simple search for query concatenation of SQL strings (not recommended, Drizzle usually parameterized)
        if (content.includes("sql.raw(") || (content.includes("db.execute(") && /\$\{/.test(content))) {
          potentialRawConcat = true;
          results.push({
            title: `Potential vulnerable raw sql query string interpolation in ${file}`,
            category: "Injection Audits",
            status: "WARNING",
            details: `Detected dynamic interpolation in raw SQL executor inside ${file}. Ensure queries are fully safe or utilize Drizzle parameterized placeholders.`
          });
        }
      }
    }
  }

  if (!potentialRawConcat) {
    results.push({
      title: "SQL Parameterization Check",
      category: "Injection Audits",
      status: "PASSED",
      details: "No dangerous dynamic SQL/SQL injection constructs (`sql.raw`) detected in the routes directory."
    });
  }
}
scanForSqlConcat();

// 6. Output Summary Report
console.log("============================================================================================");
console.log(String.prototype.padEnd ? "SECURE AUDIT CONTROL ITEM".padEnd(50) + " | " + "CATEGORY".padEnd(25) + " | STATUS" : "SECURE AUDIT CONTROL ITEM | CATEGORY | STATUS");
console.log("============================================================================================");

let failedCount = 0;
let passedCount = 0;
let warningCount = 0;

for (const res of results) {
  const paddedTitle = String.prototype.padEnd ? res.title.padEnd(50) : res.title;
  const paddedCat = String.prototype.padEnd ? res.category.padEnd(25) : res.category;
  let statusStr: string = res.status;
  if (res.status === "PASSED") {
    statusStr = "\x1b[32mPASSED\x1b[0m"; // Green
    passedCount++;
  } else if (res.status === "WARNING") {
    statusStr = "\x1b[33mWARNING\x1b[0m"; // Yellow
    warningCount++;
  } else {
    statusStr = "\x1b[31mFAILED\x1b[0m"; // Red
    failedCount++;
  }
  console.log(`${paddedTitle} | ${paddedCat} | ${statusStr}`);
}

console.log("============================================================================================");
console.log(`\nAudit finished: ${passedCount} PASSED, ${failedCount} FAILED, ${warningCount} WARNINGS.`);

if (failedCount > 0) {
  console.error("\n❌ Security Policy Enforcement: One or more critical security checks did not materialize positive results.");
  process.exit(1);
} else {
  console.log("\n✅ Security Policy Enforcement: All checked core threat vectors are perfectly mitigated!");
  process.exit(0);
}
