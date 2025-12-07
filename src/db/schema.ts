import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("passwordHash"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  failedLoginAttempts: integer("failedLoginAttempts").default(0),
  lockoutUntil: timestamp("lockoutUntil", { mode: "date" }),
  // MFA/TOTP fields
  mfaEnabled: boolean("mfaEnabled").default(false),
  mfaSecret: text("mfaSecret"), // Encrypted TOTP secret
  mfaBackupCodes: text("mfaBackupCodes"), // JSON array of hashed backup codes
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Define the composite primary key separately
export const verificationTokensPrimaryKey = primaryKey({
  columns: [verificationTokens.identifier, verificationTokens.token],
});

// Documents table for storing file metadata
// The actual files are stored in Supabase Storage
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("fileName").notNull(),
  fileSize: integer("fileSize").notNull(), // in bytes
  mimeType: text("mimeType").notNull(),
  storagePath: text("storagePath").notNull(), // path in Supabase Storage
  bucketName: text("bucketName").notNull().default("documents"),
  uploadedAt: timestamp("uploadedAt", { mode: "date" }).notNull().defaultNow(),
  description: text("description"),
});

// Audit logs table for SOC2 compliance
// Tracks all file operations (upload, download, delete, view)
export const auditLogs = pgTable("auditLogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentId: uuid("documentId").references(() => documents.id, {
    onDelete: "set null",
  }), // null if document is deleted
  action: text("action").notNull(), // 'upload', 'download', 'delete', 'view'
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
  ipAddress: text("ipAddress"), // optional: track IP for security
  userAgent: text("userAgent"), // optional: track user agent
  metadata: text("metadata"), // optional: JSON string for additional context
  success: integer("success").notNull().default(1), // 1 for success, 0 for failure
  errorMessage: text("errorMessage"), // if success = 0, store error details
  archived: integer("archived").notNull().default(0), // 1 if archived, 0 if active
});

// Audit log archives table
// Stores compressed batches of old audit logs in JSON format
export const auditLogArchives = pgTable("auditLogArchives", {
  id: uuid("id").primaryKey().defaultRandom(),
  archiveDate: timestamp("archiveDate", { mode: "date" })
    .notNull()
    .defaultNow(),
  startDate: timestamp("startDate", { mode: "date" }).notNull(),
  endDate: timestamp("endDate", { mode: "date" }).notNull(),
  recordCount: integer("recordCount").notNull(),
  logsJson: text("logsJson").notNull(), // JSON array of archived logs
  checksum: text("checksum"), // SHA-256 checksum for integrity verification
});

// Document permissions table for RBAC and document sharing
// Enables users to share documents with specific permission levels
export const documentPermissions = pgTable("documentPermissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("documentId")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionLevel: text("permissionLevel").notNull(), // 'owner', 'editor', 'viewer'
  grantedBy: uuid("grantedBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  grantedAt: timestamp("grantedAt", { mode: "date" }).notNull().defaultNow(),
  expiresAt: timestamp("expiresAt", { mode: "date" }), // optional: time-limited sharing
});

// Types for new records (for insertion)
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;
export type NewDocument = InferInsertModel<typeof documents>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
export type NewAuditLogArchive = InferInsertModel<typeof auditLogArchives>;
export type NewDocumentPermission = InferInsertModel<
  typeof documentPermissions
>;

// Types for existing records (from database)
export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type Document = InferSelectModel<typeof documents>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type AuditLogArchive = InferSelectModel<typeof auditLogArchives>;
export type DocumentPermission = InferSelectModel<typeof documentPermissions>;

// Permission levels for RBAC
export type PermissionLevel = "owner" | "editor" | "viewer";

// Audit log action types for type safety
export type AuditAction =
  | "upload"
  | "download"
  | "delete"
  | "view"
  | "list"
  | "share"
  | "revoke"
  | "access_denied"
  | "mfa_setup_initiated"
  | "mfa_setup_failed"
  | "mfa_enabled"
  | "mfa_disabled"
  | "mfa_verification"
  | "mfa_backup_code_used"
  | "mfa_disable_failed"
  | "login_attempt"
  | "login_success"
  | "login_failed"
  | "logout"
  | "session_expired"
  | "account_locked";
