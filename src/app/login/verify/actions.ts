"use server";

import { cookies } from "next/headers";

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

    // Create full session cookie
    const sessionData = JSON.stringify({
      email: tempSession.email,
      id: tempSession.userId,
    });
    cookieStore.set("session_user", sessionData, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Remove temporary MFA cookie
    cookieStore.delete("mfa_pending");

    return { success: true };
  } catch (error) {
    console.error("[MFA] Error completing login:", error);
    return { success: false, error: "Failed to complete login" };
  }
}
