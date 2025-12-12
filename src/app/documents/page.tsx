"use client";

import { useState } from "react";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentsList from "@/components/documents/DocumentsList";

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Trigger refresh of documents list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Management
          </h1>
          <p className="text-gray-600">
            Securely upload and manage your financial documents with
            SOC2-compliant storage
          </p>
        </div>

        <DocumentUpload onUploadSuccess={handleUploadSuccess} />

        <DocumentsList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
