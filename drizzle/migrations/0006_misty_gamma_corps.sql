CREATE TABLE "documentPermissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"permissionLevel" text NOT NULL,
	"grantedBy" uuid NOT NULL,
	"grantedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "documentPermissions" ADD CONSTRAINT "documentPermissions_documentId_documents_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentPermissions" ADD CONSTRAINT "documentPermissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentPermissions" ADD CONSTRAINT "documentPermissions_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "documentPermissions_documentId_userId_unique" ON "documentPermissions" ("documentId", "userId");--> statement-breakpoint
CREATE INDEX "documentPermissions_userId_idx" ON "documentPermissions" ("userId");--> statement-breakpoint
CREATE INDEX "documentPermissions_documentId_idx" ON "documentPermissions" ("documentId");