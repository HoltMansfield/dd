"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type SessionData = {
  email: string;
  id: string;
};

export async function logoutAction() {
  const cookieStore = await cookies();

  // Clear the session cookie
  cookieStore.delete("session_user");

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
