"use server";
import { withSentryError } from "@/sentry-error";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db/connect";
import { users } from "@/db/schema";
import { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS } from "./constants";
import {
  SESSION_TIMESTAMP_COOKIE,
  SESSION_CREATED_COOKIE,
} from "@/lib/session-config";
import { createAuditLog } from "@/lib/audit";

async function _loginAction(
  state:
    | {
        error?: string;
        success?: boolean;
        requiresMFA?: boolean;
        userId?: string;
      }
    | undefined,
  data: { email: string; password: string }
): Promise<
  | {
      error?: string;
      success?: boolean;
      requiresMFA?: boolean;
      userId?: string;
    }
  | undefined
> {
  const { email, password } = data;

  // Find the user
  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length === 0) {
    // Log failed login attempt for non-existent user
    // Use a placeholder userId since user doesn't exist
    await createAuditLog({
      userId: "unknown",
      action: "login_failed",
      success: false,
      errorMessage: "User not found",
      metadata: { email },
    });
    return { error: "Invalid credentials." };
  }

  const user = found[0];

  // Check if account is locked out
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    await createAuditLog({
      userId: user.id,
      action: "login_failed",
      success: false,
      errorMessage: "Account locked",
      metadata: {
        email,
        lockoutUntil: user.lockoutUntil.toISOString(),
      },
    });
    return { error: "Account is locked. Please try again later." };
  }

  // Validate password
  const valid = await bcrypt.compare(password, user.passwordHash ?? "");

  if (!valid) {
    // Increment failed login attempts
    const currentFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockoutUntil = null;

    // Lock the account if max attempts reached
    if (currentFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);

      // Update the user record with new failed attempts count and lockout
      await db
        .update(users)
        .set({
          failedLoginAttempts: currentFailedAttempts,
          lockoutUntil: lockoutUntil,
        })
        .where(eq(users.email, email));

      // Log account lockout
      await createAuditLog({
        userId: user.id,
        action: "account_locked",
        success: true,
        metadata: {
          email,
          failedAttempts: currentFailedAttempts,
          lockoutUntil: lockoutUntil.toISOString(),
        },
      });

      return { error: "Account is locked. Please try again later." };
    }

    // Update the user record with new failed attempts count
    await db
      .update(users)
      .set({
        failedLoginAttempts: currentFailedAttempts,
        lockoutUntil: lockoutUntil,
      })
      .where(eq(users.email, email));

    // Log failed login attempt
    await createAuditLog({
      userId: user.id,
      action: "login_failed",
      success: false,
      errorMessage: "Invalid password",
      metadata: {
        email,
        failedAttempts: currentFailedAttempts,
      },
    });

    return { error: "Invalid credentials." };
  }

  // If login is successful, reset failed attempts and lockout
  if ((user.failedLoginAttempts ?? 0) > 0 || user.lockoutUntil) {
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockoutUntil: null,
      })
      .where(eq(users.email, email));
  }

  // Check if user has MFA enabled
  if (user.mfaEnabled) {
    // Log successful password validation (MFA pending)
    await createAuditLog({
      userId: user.id,
      action: "login_attempt",
      success: true,
      metadata: {
        email,
        mfaRequired: true,
      },
    });

    // Store temporary session data for MFA verification
    const cookieStore = await cookies();
    const tempSessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      mfaPending: true,
    });
    cookieStore.set("mfa_pending", tempSessionData, {
      path: "/",
      maxAge: 300, // 5 minutes to complete MFA
      httpOnly: true,
    });

    // Return MFA required state
    return { requiresMFA: true, userId: user.id };
  }

  // Log successful login without MFA
  await createAuditLog({
    userId: user.id,
    action: "login_success",
    success: true,
    metadata: {
      email,
      mfaRequired: false,
    },
  });

  // Set session cookie with email, ID, and MFA status
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({
    email: user.email,
    id: user.id,
    mfaEnabled: user.mfaEnabled || false,
  });
  const now = Date.now();
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  cookieStore.set("session_user", sessionData, cookieOptions);

  // Set session timestamps for timeout tracking
  cookieStore.set(SESSION_TIMESTAMP_COOKIE, now.toString(), cookieOptions);
  cookieStore.set(SESSION_CREATED_COOKIE, now.toString(), cookieOptions);

  // Note: Sentry.setUser() is called on the client-side after successful login via SentryProvider

  // Return success to allow client-side redirect (ensures cookies are set)
  return { success: true };
}

export const loginAction = withSentryError(_loginAction);
