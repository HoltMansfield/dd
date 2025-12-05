import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_TIMESTAMP_COOKIE } from "@/lib/session-config";

/**
 * API route to extend user session
 * This updates the session timestamp to reset the inactivity timer
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_user");

    if (!sessionCookie) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    // Update session timestamp
    const now = Date.now();
    cookieStore.set(SESSION_TIMESTAMP_COOKIE, now.toString(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error) {
    console.error("[Session] Error extending session:", error);
    return NextResponse.json(
      { error: "Failed to extend session" },
      { status: 500 }
    );
  }
}
