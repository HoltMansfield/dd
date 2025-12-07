"use client";

import { useState } from "react";
import { uploadDocument } from "@/actions/documents";
import { Upload, FileText } from "lucide-react";
import { withSentryErrorClient } from "@/sentry-error";
import { SubmitButton } from "@/components/forms/SubmitButton";
import Form from "@/components/forms/Form";

export default function DocumentUpload({
  onUploadSuccess,
}: {
  onUploadSuccess?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = withSentryErrorClient(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("[DocumentUpload] Form submitted");
      setError(null);
      setSuccess(false);

      if (!selectedFile) {
        console.log("[DocumentUpload] No file selected");
        setError("Please select a file");
        return;
      }

      console.log(
        "[DocumentUpload] Starting upload for file:",
        selectedFile.name
      );
      setUploading(true);

      try {
        const form = e.currentTarget;
        const formData = new FormData(form);
        console.log(
          "[DocumentUpload] FormData created, calling uploadDocument..."
        );
        const uploadStartTime = Date.now();
        const result = await uploadDocument(formData);
        const uploadDuration = Date.now() - uploadStartTime;
        console.log(
          "[DocumentUpload] Upload completed in",
          uploadDuration,
          "ms"
        );
        console.log("[DocumentUpload] Result:", result);

        if (result.success) {
          console.log("[DocumentUpload] Upload successful!");
          setSuccess(true);
          setSelectedFile(null);
          // Reset form
          form.reset();
          // Call callback if provided
          if (onUploadSuccess) {
            console.log("[DocumentUpload] Calling onUploadSuccess callback");
            onUploadSuccess();
          }
        } else {
          console.log("[DocumentUpload] Upload failed:", result.error);
          setError(result.error || "Upload failed");
        }
      } finally {
        setUploading(false);
        console.log("[DocumentUpload] Upload process finished");
      }
    }
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Upload Document</h2>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-4">
        {/* File Input */}
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select File
          </label>
          <div className="relative">
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
              disabled={uploading}
              required
            />
          </div>
          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name}</span>
              <span className="text-gray-400">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Accepted: PDF, Images, Excel, Word, CSV (Max 50MB)
          </p>
        </div>

        {/* Description (Optional) */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Add a description for this document..."
            disabled={uploading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Document uploaded successfully!
            </p>
          </div>
        )}

        {/* Submit Button */}
        <SubmitButton
          isPending={uploading}
          pendingText="Uploading..."
          disabled={!selectedFile}
          className="w-full"
        >
          <span className="flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </span>
        </SubmitButton>
      </Form>
    </div>
  );
}
