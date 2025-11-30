"use client";

import { useEffect, useState } from "react";
import {
  getUserDocuments,
  getDocumentDownloadUrl,
  deleteDocument,
} from "@/actions/documents";
import { Document } from "@/db/schema";
import {
  FileText,
  Download,
  Trash2,
  Loader2,
  File,
  Image,
  FileSpreadsheet,
} from "lucide-react";

export default function DocumentsList({
  refreshTrigger,
}: {
  refreshTrigger?: number;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserDocuments();
      if (result.success && result.documents) {
        setDocuments(result.documents);
      } else {
        setError(result.error || "Failed to load documents");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]);

  const handleDownload = async (documentId: string, fileName: string) => {
    setDownloadingId(documentId);
    try {
      const result = await getDocumentDownloadUrl(documentId);
      if (result.success && result.url) {
        // Open download in new tab
        const link = document.createElement("a");
        link.href = result.url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.error || "Failed to download document");
      }
    } catch (err) {
      alert("An unexpected error occurred");
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeletingId(documentId);
    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        // Remove from local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      } else {
        alert(result.error || "Failed to delete document");
      }
    } catch (err) {
      alert("An unexpected error occurred");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (mimeType.includes("pdf")) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Documents</h2>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(doc.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {doc.fileName}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.uploadedAt)}</span>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {doc.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleDownload(doc.id, doc.fileName)}
                disabled={downloadingId === doc.id}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                title="Download"
              >
                {downloadingId === doc.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => handleDelete(doc.id, doc.fileName)}
                disabled={deletingId === doc.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === doc.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
