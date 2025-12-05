"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from "@/lib/session-config";

/**
 * Session timeout warning component for SOC2 compliance
 *
 * Features:
 * - Warns user before session expires
 * - Allows user to extend session
 * - Automatically logs out on timeout
 */
export default function SessionTimeoutWarning() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const extendSession = useCallback(async () => {
    // Make a request to update the session timestamp
    // The middleware will automatically update the timestamp
    await fetch("/api/extend-session", { method: "POST" });
    setShowWarning(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutAction();
  }, []);

  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;
    let logoutTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimers = () => {
      // Clear existing timers
      if (warningTimeout) clearTimeout(warningTimeout);
      if (logoutTimeout) clearTimeout(logoutTimeout);
      if (countdownInterval) clearInterval(countdownInterval);

      // Calculate when to show warning (timeout - warning period)
      const warningTime = SESSION_TIMEOUT_MS - SESSION_WARNING_MS;

      // Set warning timer
      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(SESSION_WARNING_MS);

        // Start countdown
        countdownInterval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1000) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }, warningTime);

      // Set automatic logout timer
      logoutTimeout = setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT_MS);
    };

    // Initialize timers
    resetTimers();

    // Reset timers on user activity
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (logoutTimeout) clearTimeout(logoutTimeout);
      if (countdownInterval) clearInterval(countdownInterval);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [showWarning, handleLogout]);

  if (!showWarning) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Session Expiring Soon
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          Your session will expire in{" "}
          <span className="font-semibold text-gray-900">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>{" "}
          due to inactivity. Would you like to continue your session?
        </p>

        <div className="flex gap-3">
          <button
            onClick={extendSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Continue Session
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          For security purposes, sessions automatically expire after 30 minutes
          of inactivity.
        </p>
      </div>
    </div>
  );
}
