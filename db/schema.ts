import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  stripe_customer_id: text("stripe_customer_id"),
  subscription_status: text("subscription_status"),
  subscription_plan: text("subscription_plan"),
  credits: integer("credits").default(0).notNull(),
  is_admin: integer("is_admin").default(0).notNull(),
  email: text("email"),
  name: text("name"),
  password_hash: text("password_hash"),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
  has_used_analysis_trial: integer("has_used_analysis_trial").default(0).notNull(),
  has_used_trial: integer("has_used_trial").default(0).notNull(),
  referral_code: text("referral_code").unique(),
  referred_by: text("referred_by"),
  is_suspended: integer("is_suspended").default(0).notNull(),
  avatar_url: text("avatar_url"),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  plan: text("plan").notNull(),
  type: text("type").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  title: text("title").notNull(),
  data: text("data").notNull(),
  template: text("template").notNull(),
  accent_color: text("accent_color"),
  font_family: text("font_family"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const resumeVersions = pgTable("resume_versions", {
  id: text("id").primaryKey(),
  resume_id: text("resume_id").notNull(),
  data: text("data").notNull(),
  template: text("template").notNull(),
  accent_color: text("accent_color"),
  font_family: text("font_family"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentVerifications = pgTable("payment_verifications", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  method: text("method").notNull(), // 'wantok', 'sms', 'mobile_banking', 'internet_banking'
  receipt_number: text("receipt_number"),
  amount: integer("amount"), // Amount in local currency or USD equivalent
  currency: text("currency").default('PGK'),
  screenshot_url: text("screenshot_url"), // URL or base64 of the uploaded screenshot
  status: text("status").default('pending'), // 'pending', 'approved', 'rejected'
  notes: text("notes"), // Admin notes for rejection or approval reasons
  reviewed_by: text("reviewed_by"), // Admin user ID
  plan: text("plan").notNull(), // Target plan or credit package
  type: text("type").notNull(), // 'subscription', 'credits'
  ocr_data: text("ocr_data"), // JSON representation of OCR analysis results
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  admin_id: text("admin_id").notNull(),
  admin_email: text("admin_email").notNull(),
  action_type: text("action_type").notNull(), // 'suspend', 'unsuspend', 'change_role', 'password_reset', 'adjust_credits', 'payment_approve', 'payment_reject', 'setting_update', 'setting_delete'
  target_id: text("target_id"),
  details: text("details").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  user_id: text("user_id"),
  session_id: text("session_id").notNull(),
  event_name: text("event_name").notNull(), // 'page_view', 'resume_create', 'cover_letter_create', 'purchase_click', 'template_view', etc.
  path: text("path"),
  referrer: text("referrer"),
  device_type: text("device_type").notNull(), // 'Desktop', 'Mobile', 'Tablet'
  browser: text("browser"),
  os: text("os"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Types for backward compatibility
export type DbUser = typeof users.$inferSelect;
export type DbTransaction = typeof transactions.$inferSelect;
export type DbResume = typeof resumes.$inferSelect;
export type DbResumeVersion = typeof resumeVersions.$inferSelect;
export type DbSetting = typeof settings.$inferSelect;
export type DbPaymentVerification = typeof paymentVerifications.$inferSelect;
export type DbAuditLog = typeof auditLogs.$inferSelect;
export type DbAnalyticsEvent = typeof analyticsEvents.$inferSelect;

import { env } from "../src/lib/env.ts";
import { drizzle as drizzlePgJs } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";

import os from "os";
import path from "path";

const hasDbUrl = !!env.DATABASE_URL;

export const sql = hasDbUrl ? postgres(env.DATABASE_URL!) : null as any;

let clientInstance: any = null;

if (!hasDbUrl) {
  const pathsToTry = [
    path.join(process.cwd(), ".careercraft-db"),
    path.join(os.tmpdir(), "careercraft-pglite-db"),
    path.join(os.homedir(), ".careercraft-db"),
    "" // Fallback to in-memory
  ];

  for (const dbPath of pathsToTry) {
    try {
      if (dbPath) {
        clientInstance = new PGlite(dbPath);
        console.log(`[Database] PGlite database successfully initialized at: ${dbPath}`);
      } else {
        clientInstance = new PGlite();
        console.log(`[Database] PGlite database successfully initialized in-memory (fallback).`);
      }
      break;
    } catch (e) {
      console.warn(`[Database] Failed to initialize PGlite at ${dbPath || "in-memory"}:`, e);
    }
  }
}

export const client = clientInstance;
export const db = hasDbUrl ? drizzlePgJs(sql!) : drizzlePgLite(client!);




