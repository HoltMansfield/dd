CREATE TABLE "auditLogArchives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"archiveDate" timestamp DEFAULT now() NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"recordCount" integer NOT NULL,
	"logsJson" text NOT NULL,
	"checksum" text
);
--> statement-breakpoint
ALTER TABLE "auditLogs" ADD COLUMN "archived" integer DEFAULT 0 NOT NULL;