// Fixture for creating test users for RBAC tests
import bcrypt from "bcryptjs";
import { db } from "../../src/db/connect";
import { users } from "../../src/db/schema";
import { eq } from "drizzle-orm";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export const RBAC_TEST_USERS = {
  owner: {
    email: "rbac-owner@example.com",
    password: "Owner123!",
    name: "Document Owner",
  },
  editor: {
    email: "rbac-editor@example.com",
    password: "Editor123!",
    name: "Document Editor",
  },
  viewer: {
    email: "rbac-viewer@example.com",
    password: "Viewer123!",
    name: "Document Viewer",
  },
  unauthorized: {
    email: "rbac-unauthorized@example.com",
    password: "Unauthorized123!",
    name: "Unauthorized User",
  },
};

/**
 * Create or get existing test users for RBAC tests
 */
export async function setupRBACTestUsers(): Promise<
  Record<keyof typeof RBAC_TEST_USERS, TestUser>
> {
  const createdUsers: Record<string, TestUser> = {};

  for (const [role, userData] of Object.entries(RBAC_TEST_USERS)) {
    try {
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser) {
        console.log(`[RBAC Setup] User ${userData.email} already exists`);
        createdUsers[role] = {
          id: existingUser.id,
          email: existingUser.email!,
          password: userData.password,
          name: existingUser.name!,
        };
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const [newUser] = await db
          .insert(users)
          .values({
            email: userData.email,
            passwordHash,
            name: userData.name,
            emailVerified: new Date(),
          })
          .returning();

        console.log(`[RBAC Setup] Created user ${userData.email}`);
        createdUsers[role] = {
          id: newUser.id,
          email: newUser.email!,
          password: userData.password,
          name: newUser.name!,
        };
      }
    } catch (error) {
      console.error(
        `[RBAC Setup] Error creating user ${userData.email}:`,
        error
      );
      throw error;
    }
  }

  return createdUsers as Record<keyof typeof RBAC_TEST_USERS, TestUser>;
}

/**
 * Clean up RBAC test users
 */
export async function cleanupRBACTestUsers() {
  for (const userData of Object.values(RBAC_TEST_USERS)) {
    try {
      await db.delete(users).where(eq(users.email, userData.email));
      console.log(`[RBAC Cleanup] Deleted user ${userData.email}`);
    } catch (error) {
      console.error(
        `[RBAC Cleanup] Error deleting user ${userData.email}:`,
        error
      );
    }
  }
}
