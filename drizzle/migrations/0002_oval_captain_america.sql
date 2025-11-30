ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockoutUntil" timestamp;