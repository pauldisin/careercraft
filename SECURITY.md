# CareerCraft Security & Auditing Policies

This document outlines CareerCraft's comprehensive product security posture, penetration testing guides, and details regarding our regular security audit scripts and checks.

---

## 🛡️ Key Security Guardrails & Hard Failures

CareerCraft implements robust security protections that **hard-fail** at startup in production environments to guarantee secure operations:

1. **Mandatory `JWT_SECRET`**:
   - In production environments, a robust `JWT_SECRET` (minimum of 32 characters) **must** be provided.
   - If missing or weak, the environment will experience a hard-stop startup failure.
2. **Mandatory `REDIS_URL`**:
   - CareerCraft uses Redis for multi-instance Rate Limiting and Reset Token Persistence.
   - If `REDIS_URL` is omitted in production, startup halts immediately.
3. **Explicit `DEMO_MODE` Disabling**:
   - To avoid the accidental exposure of sensitive payment pathways or bypass parameters, Startup throws a hard fatal error if `DEMO_MODE` is enabled in production.

---

## 🔍 Automated Verification Scans

We have integrated an automated, offline static security scan script to routinely verify that audit control gates are in place.

### How to Run the Security Audit Script

You can invoke this script locally or as a CI/CD build pipe gating action:

```bash
# Run via npm script
npm run security-audit

# Run directly via tsx (pre-bundled)
npx tsx scripts/security-audit.ts
```

This verification scan parses environment structures, checks registration endpoint assertions for strong password enforcement, verifies Helmet middleware headers, and scans query parameters for static SQL injection hazards.

---

## 🛠️ Recommended Regular Security Audits

### 1. Dependency Analysis (Composition Audits)
Inspect your node module dependencies for known vulnerabilities quarterly.

```bash
# General vulnerability check
npm audit

# High-priority auto fixes if available safely
npm audit fix --production
```

### 2. Static Application Security Testing (SAST)
In addition to our `security-audit.ts` static analyzer, consider running comprehensive lint checks to enforce clean type bounds during compile:

```bash
# Verify type safety
npm run lint
```

### 3. Penetration Testing Checklist

When inviting authorized penetration testing groups or conducting manual white-box code assessments, prioritize validation across these three primary threat vectors:

#### Vector A: Authentication Bypasses (session pollution / password weak spots)
- **Attack Attempt**: Register an administrator account directly, or trigger a custom request to administrative reset pathways.
- **Controls Tested**: User password updates and admin resets are protected by `validatePassword(password, isAdmin)` and validated via precise database constraints. Confirm that the application safely rejects non-compliant inputs with `400 WEAK_PASSWORD`.

#### Vector B: SQL Injection & ORM Escapes
- **Attack Attempt**: Inject special SQL notation, quotes, or JSON brackets (e.g., `' OR '1'='1`) into the URL path parameters or request payloads.
- **Controls Tested**: CareerCraft uses parameterized statements mediated through **Drizzle ORM**. Our static analyzer checks routes for dynamic string compilation practices.

#### Vector C: Rate Limitting Sandbox & Resource Abuse
- **Attack Attempt**: Attempt high-speed concurrent brute-forcing of credentials or document compile triggers (e.g., flooding POST `/api/ai/compile`).
- **Controls Tested**: Multi-instance consistent rate limiting using the Redis store backplane will correctly throttle requests with `429 Too Many Requests` state codes.

---

## 📬 Reporting Vulnerabilities

If you discover any security issues or potential threat vectors within CareerCraft, do not open public GitHub issues. Please contact the lead administrator team or reach out privately.
