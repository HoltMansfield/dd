import crypto from "crypto";

/**
 * Calculate SHA-256 checksum of a buffer
 * Used for data integrity verification during upload/download
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Verify that a buffer matches the expected checksum
 * Returns true if checksums match, false otherwise
 */
export function verifyChecksum(
  buffer: Buffer,
  expectedChecksum: string
): boolean {
  const actualChecksum = calculateChecksum(buffer);
  return actualChecksum === expectedChecksum;
}

/**
 * Result of integrity verification
 */
export type IntegrityCheckResult = {
  valid: boolean;
  expectedChecksum?: string;
  actualChecksum?: string;
  error?: string;
};

/**
 * Verify data integrity with detailed result
 */
export function verifyIntegrity(
  buffer: Buffer,
  expectedChecksum: string
): IntegrityCheckResult {
  try {
    const actualChecksum = calculateChecksum(buffer);
    const valid = actualChecksum === expectedChecksum;

    return {
      valid,
      expectedChecksum,
      actualChecksum,
      ...(valid ? {} : { error: "Checksum mismatch - data may be corrupted" }),
    };
  } catch (error) {
    return {
      valid: false,
      error: `Integrity check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
