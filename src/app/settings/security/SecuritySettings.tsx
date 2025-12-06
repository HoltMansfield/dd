"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MFASetup from "../../../components/MFASetup";
import { disableMFAAction } from "../../../actions/mfa";
import { getMFAEnforcementMessage } from "../../../lib/mfa-config";

interface SecuritySettingsProps {
  initialMFAEnabled: boolean;
  mfaRequired?: boolean;
  redirectPath?: string;
}

export default function SecuritySettings({
  initialMFAEnabled,
  mfaRequired = false,
  redirectPath,
}: SecuritySettingsProps) {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(initialMFAEnabled);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-open MFA setup if required
  useEffect(() => {
    if (mfaRequired && !mfaEnabled) {
      setShowMFASetup(true);
    }
  }, [mfaRequired, mfaEnabled]);

  const handleEnableMFA = () => {
    setShowMFASetup(true);
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    setMfaEnabled(true);

    // Redirect to original destination if provided
    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  const handleDisableMFA = async () => {
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    const result = await disableMFAAction(password);

    if (result.success) {
      setMfaEnabled(false);
      setShowDisableConfirm(false);
      setPassword("");
    } else {
      setError(result.error || "Failed to disable MFA");
    }

    setLoading(false);
  };

  if (showMFASetup) {
    return (
      <MFASetup
        onComplete={handleMFASetupComplete}
        onCancel={
          mfaRequired
            ? undefined // Don't allow cancel if MFA is required
            : () => setShowMFASetup(false)
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* MFA Required Banner */}
      {mfaRequired && !mfaEnabled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Multi-Factor Authentication Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You must enable MFA to access documents. This is required for
                  security compliance in this environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MFA Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600 mb-4">
              Add an extra layer of security to your account with two-factor
              authentication.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-sm text-gray-700">
                {getMFAEnforcementMessage()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  mfaEnabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {mfaEnabled ? "Enabled" : "Disabled"}
              </div>
              {mfaEnabled && (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">Protected</span>
                </div>
              )}
            </div>
          </div>
          <div>
            {!mfaEnabled ? (
              <button
                onClick={handleEnableMFA}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Enable MFA
              </button>
            ) : (
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Disable MFA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disable MFA Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Disable Two-Factor Authentication
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Warning: Disabling MFA will make your account less secure.
              </p>
            </div>
            <p className="text-gray-600 mb-4">
              Enter your password to confirm:
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) {
                  handleDisableMFA();
                }
              }}
              placeholder="Your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none mb-4"
            />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableConfirm(false);
                  setPassword("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMFA}
                disabled={loading || !password}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Disabling..." : "Disable MFA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Security Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Password</h2>
        <p className="text-gray-600 mb-4">
          Change your password to keep your account secure.
        </p>
        <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          Change Password
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Sessions
        </h2>
        <p className="text-gray-600 mb-4">
          Manage your active sessions across devices.
        </p>
        <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          View Sessions
        </button>
      </div>
    </div>
  );
}
