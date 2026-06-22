CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"event_name" text NOT NULL,
	"path" text,
	"referrer" text,
	"device_type" text NOT NULL,
	"browser" text,
	"os" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"admin_email" text NOT NULL,
	"action_type" text NOT NULL,
	"target_id" text,
	"details" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_suspended" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_verifications" ADD COLUMN IF NOT EXISTS "ocr_data" text;
