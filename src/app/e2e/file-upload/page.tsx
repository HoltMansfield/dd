"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentsList from "@/components/documents/DocumentsList";

export default function E2EFileUploadPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>E2E File Upload Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This page is only accessible when{" "}
                <code className="bg-yellow-100 px-1 py-0.5 rounded">
                  NEXT_PUBLIC_APP_ENV=E2E
                </code>
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Use this page to test file upload functionality in E2E tests.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsList refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
