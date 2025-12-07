"use server";

import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { withSentryError } from "@/sentry-error";

/**
 * Server action to log session expiration
 * Called from client when timeout parameter is detected
 */
async function _logSessionExpiration() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_user");

  if (!sessionCookie?.value) {
    return;
  }

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
}

export const logSessionExpiration = withSentryError(_logSessionExpiration);
