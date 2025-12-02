"use client";

import { useState } from "react";
import { initializeMFASetup, completeMFASetup } from "../actions/mfa";
import { getMFAEnforcementMessage } from "../lib/mfa-config";

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<"intro" | "scan" | "verify" | "backup">(
    "intro"
  );
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleStartSetup = async () => {
    setLoading(true);
    setError("");

    const result = await initializeMFASetup();

    if (result.success && result.qrCode && result.secret) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setStep("scan");
    } else {
      setError(result.error || "Failed to initialize MFA setup");
    }

    setLoading(false);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    const result = await completeMFASetup(secret, verificationCode);

    if (result.success && result.backupCodes) {
      setBackupCodes(result.backupCodes);
      setStep("backup");
    } else {
      setError(result.error || "Invalid verification code");
    }

    setLoading(false);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Intro Step */}
      {step === "intro" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Enable Two-Factor Authentication
          </h2>
          <p className="text-gray-600">
            Add an extra layer of security to your account by requiring a
            verification code from your authenticator app when you sign in.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              {getMFAEnforcementMessage()}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">
              What you&apos;ll need:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Your phone or tablet</li>
              <li>A few minutes to complete setup</li>
            </ul>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up..." : "Get Started"}
            </button>
            {onCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scan QR Code Step */}
      {step === "scan" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
          <p className="text-gray-600">
            Open your authenticator app and scan this QR code:
          </p>
          <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-gray-200">
            {qrCode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCode} alt="MFA QR Code" className="w-64 h-64" />
            )}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-2">
              Can&apos;t scan? Enter this code manually:
            </p>
            <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-300 break-all">
              {secret}
            </code>
          </div>
          <button
            onClick={() => setStep("verify")}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Next: Verify Code
          </button>
        </div>
      )}

      {/* Verify Code Step */}
      {step === "verify" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Verify Setup</h2>
          <p className="text-gray-600">
            Enter the 6-digit code from your authenticator app:
          </p>
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("scan")}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes Step */}
      {step === "backup" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Two-Factor Authentication Enabled!
            </h2>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800 font-semibold mb-2">
              ⚠️ Save Your Backup Codes
            </p>
            <p className="text-sm text-yellow-700">
              Store these codes in a safe place. Each code can only be used once
              if you lose access to your authenticator app.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white px-3 py-2 rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadBackupCodes}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Download Codes
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
