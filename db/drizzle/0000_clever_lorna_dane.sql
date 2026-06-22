CREATE TABLE IF NOT EXISTS "resume_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"resume_id" text NOT NULL,
	"data" text NOT NULL,
	"template" text NOT NULL,
	"accent_color" text,
	"font_family" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resumes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"data" text NOT NULL,
	"template" text NOT NULL,
	"accent_color" text,
	"font_family" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text NOT NULL,
	"plan" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"subscription_status" text,
	"subscription_plan" text,
	"credits" integer DEFAULT 0 NOT NULL,
	"is_admin" integer DEFAULT 0 NOT NULL,
	"email" text,
	"name" text,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	"has_used_analysis_trial" integer DEFAULT 0 NOT NULL,
	"has_used_trial" integer DEFAULT 0 NOT NULL
);
