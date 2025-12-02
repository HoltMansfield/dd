ALTER TABLE "users" ADD COLUMN "mfaEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfaSecret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfaBackupCodes" text;