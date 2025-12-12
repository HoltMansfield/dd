"use client";

import { useState } from "react";
import { verifyMFAToken, verifyMFABackupCode } from "@/actions/mfa";
import { shouldEnforceMFA } from "@/lib/mfa-config";
import { withSentryErrorClient } from "@/sentry-error";
import { LoadingButton } from "@/components/forms/LoadingButton";

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function MFAVerification({
  userId,
  onSuccess,
  onCancel,
}: MFAVerificationProps) {
  const [code, setCode] = useState<string>("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const isEnforced = shouldEnforceMFA();

  const handleVerify = withSentryErrorClient(async () => {
    if (code.length < 6) {
      setError(
        useBackupCode
          ? "Please enter your backup code"
          : "Please enter a 6-digit code"
      );
      return;
    }

    setLoading(true);
    setError("");

    const result = useBackupCode
      ? await verifyMFABackupCode(userId, code)
      : await verifyMFAToken(userId, code);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Invalid code");
      setCode("");
    }

    setLoading(false);
  });

  const handleSkip = () => {
    if (!isEnforced && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600 mt-2">
            {useBackupCode
              ? "Enter one of your backup codes"
              : "Enter the code from your authenticator app"}
          </p>
        </div>

        <div>
          <input
            type="text"
            inputMode={useBackupCode ? "text" : "numeric"}
            pattern={useBackupCode ? undefined : "[0-9]*"}
            maxLength={useBackupCode ? 8 : 6}
            value={code}
            onChange={(e) => {
              const value = useBackupCode
                ? e.target.value.toUpperCase()
                : e.target.value.replace(/\D/g, "");
              setCode(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.length >= 6) {
                handleVerify();
              }
            }}
            placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
            className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <LoadingButton
          onClick={handleVerify}
          isLoading={loading}
          loadingText="Verifying..."
          disabled={code.length < 6}
          className="w-full"
        >
          Verify
        </LoadingButton>

        <div className="text-center">
          <button
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
              setError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {useBackupCode
              ? "Use authenticator code instead"
              : "Use backup code instead"}
          </button>
        </div>

        {!isEnforced && onCancel && (
          <div className="text-center pt-2 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Skip for now (development mode)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
