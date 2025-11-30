"use server";
import { withSentryError } from "@/sentry-error";
import { cookies } from "next/headers";
import { db } from "@/db/connect";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS } from "./constants";
import { redirect } from "next/navigation";

async function _loginAction(
  state: { error?: string; success?: boolean } | undefined,
  data: { email: string; password: string }
): Promise<{ error?: string; success?: boolean } | undefined> {
  const { email, password } = data;

  // Find the user
  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length === 0) {
    return { error: "Invalid credentials." };
  }

  const user = found[0];

  // Check if account is locked out
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
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

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("session_user", user.email ?? "", { path: "/" });

  // Note: Sentry.setUser() is called on the client-side after successful login via SentryProvider

  // Use server-side redirect instead of returning success
  redirect("/");
}

export const loginAction = withSentryError(_loginAction);
