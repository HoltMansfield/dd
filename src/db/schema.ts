import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  integer,
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
});

// Types for new records (for insertion)
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;
export type NewDocument = InferInsertModel<typeof documents>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// Types for existing records (from database)
export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type Document = InferSelectModel<typeof documents>;
export type AuditLog = InferSelectModel<typeof auditLogs>;

// Audit log action types for type safety
export type AuditAction = "upload" | "download" | "delete" | "view" | "list";
