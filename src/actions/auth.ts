"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_TIMESTAMP_COOKIE,
  SESSION_CREATED_COOKIE,
} from "@/lib/session-config";

type SessionData = {
  email: string;
  id: string;
};

export async function logoutAction() {
  const cookieStore = await cookies();

  // Clear all session cookies
  cookieStore.delete("session_user");
  cookieStore.delete(SESSION_TIMESTAMP_COOKIE);
  cookieStore.delete(SESSION_CREATED_COOKIE);

  // Redirect to login page
  redirect("/login");
}

/**
 * Get current user email from session
 * @deprecated Use getCurrentUserId() for user ID or getSessionData() for both
 */
export async function getCurrentUser(): Promise<string | null> {
  const sessionData = await getSessionData();
  return sessionData?.email || null;
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const sessionData = await getSessionData();
  return sessionData?.id || null;
}

/**
 * Get full session data (email and ID)
 */
export async function getSessionData(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_user");

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as SessionData;
  } catch {
    // If parsing fails, return null (old format or corrupted)
    return null;
  }
}
