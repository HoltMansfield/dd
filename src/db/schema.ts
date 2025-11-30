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

// Types for new records (for insertion)
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;

// Types for existing records (from database)
export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
