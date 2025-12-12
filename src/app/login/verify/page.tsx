"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import MFAVerification from "@/components/core/mfa/MFAVerification";
import { completeMFALogin } from "./actions";
import { ErrorMessage } from "@/components/forms/ErrorMessage";

function MFAVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!userId) {
      // No userId means invalid access
      router.push("/login");
    }
  }, [userId, router]);

  const handleSuccess = async () => {
    // Complete the login process
    const result = await completeMFALogin();

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Failed to complete login");
    }
  };

  const handleCancel = () => {
    // In LOCAL environment, allow skipping MFA
    router.push("/");
  };

  if (!userId) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
      {error && (
        <ErrorMessage message={error} className="max-w-md w-full mb-4" />
      )}
      <MFAVerification
        userId={userId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </main>
  );
}

export default function MFAVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <MFAVerifyContent />
    </Suspense>
  );
}
