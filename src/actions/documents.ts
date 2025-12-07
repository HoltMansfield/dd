"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db/connect";
import { documents } from "@/db/schema";
import { getCurrentUserId } from "./auth";
import { createAuditLog } from "@/lib/audit";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { withSentryError } from "@/sentry-error";

const BUCKET_NAME = "documents";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

type UploadResult = {
  success: boolean;
  documentId?: string;
  error?: string;
};

/**
 * Upload a document to Supabase Storage and save metadata to Neon DB
 */
async function _uploadDocument(formData: FormData): Promise<UploadResult> {
  console.log("[uploadDocument] Starting upload process");
  console.log(
    "[uploadDocument] Supabase URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  console.log(
    "[uploadDocument] Has Service Role Key:",
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get current user ID outside try block so it's accessible in catch
  const userId = await getCurrentUserId();
  console.log("[uploadDocument] User ID:", userId);
  if (!userId) {
    console.log("[uploadDocument] ERROR: No user ID found");
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    // Get file from form data
    const file = formData.get("file") as File;
    console.log(
      "[uploadDocument] File received:",
      file?.name,
      "Size:",
      file?.size,
      "Type:",
      file?.type
    );
    if (!file) {
      console.log("[uploadDocument] ERROR: No file in form data");
      return { success: false, error: "No file provided" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log("[uploadDocument] ERROR: File too large");
      return {
        success: false,
        error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.log("[uploadDocument] ERROR: Invalid MIME type:", file.type);
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Allowed types: PDF, images, Excel, Word, CSV`,
      };
    }

    // Generate unique file path: userId/uuid-filename
    const fileId = uuidv4();
    const fileExtension = file.name.split(".").pop();
    const storagePath = `${userId}/${fileId}.${fileExtension}`;
    console.log("[uploadDocument] Storage path:", storagePath);
    console.log("[uploadDocument] Bucket name:", BUCKET_NAME);

    // Convert file to buffer
    console.log("[uploadDocument] Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("[uploadDocument] Buffer size:", buffer.length);

    // Upload to Supabase Storage
    console.log("[uploadDocument] Starting Supabase upload...");
    const uploadStartTime = Date.now();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
    const uploadDuration = Date.now() - uploadStartTime;
    console.log(
      "[uploadDocument] Supabase upload completed in",
      uploadDuration,
      "ms"
    );

    if (uploadError) {
      console.error("[uploadDocument] Supabase upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload file: ${uploadError.message}`,
      };
    }
    console.log("[uploadDocument] Supabase upload successful:", uploadData);

    // Get optional description from form data
    const description = formData.get("description") as string | null;

    // Save metadata to Neon DB
    console.log("[uploadDocument] Saving metadata to database...");
    const [document] = await db
      .insert(documents)
      .values({
        userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath: uploadData.path,
        bucketName: BUCKET_NAME,
        description: description || null,
      })
      .returning();

    console.log(
      "[uploadDocument] Database insert successful. Document ID:",
      document.id
    );
    console.log("[uploadDocument] Upload process completed successfully");

    // Create audit log for successful upload
    await createAuditLog({
      userId,
      action: "upload",
      documentId: document.id,
      success: true,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return {
      success: true,
      documentId: document.id,
    };
  } catch (error) {
    console.error("[uploadDocument] FATAL ERROR:", error);
    console.error(
      "[uploadDocument] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Create audit log for failed upload
    if (userId) {
      await createAuditLog({
        userId,
        action: "upload",
        success: false,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }

    return {
      success: false,
      error: "An unexpected error occurred during upload",
    };
  }
}

export const uploadDocument = withSentryError(_uploadDocument);

/**
 * Get a signed URL for downloading a document
 * URL expires after 1 hour
 */
async function _getDocumentDownloadUrl(
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Get current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  // Get document metadata from DB
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1);

  if (!document) {
    return { success: false, error: "Document not found or access denied" };
  }

  // Generate signed URL (expires in 1 hour)
  const { data, error } = await supabaseAdmin.storage
    .from(document.bucketName)
    .createSignedUrl(document.storagePath, 3600);

  if (error) {
    console.error("Error creating signed URL:", error);

    // Create audit log for failed download
    await createAuditLog({
      userId,
      action: "download",
      documentId,
      success: false,
      errorMessage: error.message || "Failed to generate download URL",
    });

    return { success: false, error: "Failed to generate download URL" };
  }

  // Create audit log for successful download
  await createAuditLog({
    userId,
    action: "download",
    documentId,
    success: true,
    metadata: {
      fileName: document.fileName,
    },
  });

  return { success: true, url: data.signedUrl };
}

export const getDocumentDownloadUrl = withSentryError(_getDocumentDownloadUrl);

/**
 * Get all documents for the current user
 */
async function _getUserDocuments() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(documents.uploadedAt);

  return { success: true, documents: userDocuments };
}

export const getUserDocuments = withSentryError(_getUserDocuments);

/**
 * Delete a document from both Supabase Storage and Neon DB
 */
async function _deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  // Get document metadata
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1);

  if (!document) {
    return { success: false, error: "Document not found or access denied" };
  }

  // Delete from Supabase Storage
  const { error: storageError } = await supabaseAdmin.storage
    .from(document.bucketName)
    .remove([document.storagePath]);

  if (storageError) {
    console.error("Error deleting from storage:", storageError);
    // Continue to delete from DB even if storage deletion fails
  }

  // Delete metadata from DB
  await db.delete(documents).where(eq(documents.id, documentId));

  // Create audit log for successful delete
  await createAuditLog({
    userId,
    action: "delete",
    documentId,
    success: true,
    metadata: {
      fileName: document.fileName,
      fileSize: document.fileSize,
    },
  });

  return { success: true };
}

export const deleteDocument = withSentryError(_deleteDocument);
