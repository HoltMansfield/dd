"use server";

import { cookies } from "next/headers";
import {
  SESSION_TIMESTAMP_COOKIE,
  SESSION_CREATED_COOKIE,
} from "@/lib/session-config";

/**
 * Complete MFA login by converting temporary MFA cookie to full session
 */
export async function completeMFALogin(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const mfaPendingCookie = cookieStore.get("mfa_pending");

    if (!mfaPendingCookie) {
      return { success: false, error: "No pending MFA session" };
    }

    const tempSession = JSON.parse(mfaPendingCookie.value);

    if (!tempSession.mfaPending || !tempSession.userId || !tempSession.email) {
      return { success: false, error: "Invalid MFA session" };
    }

    // Create full session cookie with MFA enabled flag
    const sessionData = JSON.stringify({
      email: tempSession.email,
      id: tempSession.userId,
      mfaEnabled: true, // User just completed MFA, so it's enabled
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

    // Remove temporary MFA cookie
    cookieStore.delete("mfa_pending");

    return { success: true };
  } catch (error) {
    console.error("[MFA] Error completing login:", error);
    return { success: false, error: "Failed to complete login" };
  }
}
