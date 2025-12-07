"use server";

import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";

/**
 * Server action to log session expiration
 * Called from client when timeout parameter is detected
 */
export async function logSessionExpiration() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_user");

    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        await createAuditLog({
          userId: sessionData.id || "unknown",
          action: "session_expired",
          success: true,
          metadata: {
            reason: "Session expired (detected on login page)",
            email: sessionData.email,
          },
        });
      } catch (parseError) {
        console.error(
          "[Session Expiration] Error parsing session:",
          parseError
        );
      }
    }
  } catch (error) {
    console.error("[Session Expiration] Error logging:", error);
  }
}
