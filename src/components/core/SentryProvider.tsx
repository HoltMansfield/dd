"use client";
import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import "../../../sentry.client.config";

export default function SentryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lastIdentifiedUser = useRef<string | null>(null);

  useEffect(() => {
    // Check if user is logged in and identify them
    const checkUserSession = () => {
      // Check for session cookie (this is a simple check)
      const cookies = document.cookie.split(";");
      const sessionCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("session_user=")
      );

      if (sessionCookie) {
        const sessionValue = decodeURIComponent(sessionCookie.split("=")[1]);
        try {
          // Parse JSON session data
          const sessionData = JSON.parse(sessionValue);
          if (
            sessionData.email &&
            sessionData.email !== lastIdentifiedUser.current
          ) {
            // Only identify if this is a different user than last time
            Sentry.setUser({
              email: sessionData.email,
              id: sessionData.id,
            });
            lastIdentifiedUser.current = sessionData.email;
          }
        } catch {
          // If parsing fails, ignore (old format or corrupted)
        }
      } else if (lastIdentifiedUser.current !== null) {
        // User logged out - clear the last identified user
        Sentry.setUser(null);
        lastIdentifiedUser.current = null;
      }
    };

    // Identify user on initial load and when component mounts
    checkUserSession();

    // Optional: Listen for storage events if you want to detect login/logout in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user_session_changed") {
        checkUserSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // Empty dependency array - only run once

  return <>{children}</>;
}
