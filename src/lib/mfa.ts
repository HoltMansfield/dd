import { authenticator } from "otplib";
import { createHash, randomBytes } from "crypto";
import QRCode from "qrcode";
import { db } from "../db/connect";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before/after for clock drift
  step: 30, // 30 second time step
};

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code URL for TOTP setup
 * @param email - User's email
 * @param secret - TOTP secret
 * @param issuer - App name (default: "Document Storage")
 */
export async function generateQRCode(
  email: string,
  secret: string,
  issuer: string = "Document Storage"
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  return await QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify a TOTP token
 * @param token - 6-digit code from authenticator app
 * @param secret - User's TOTP secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("[MFA] Error verifying TOTP:", error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 * @param count - Number of backup codes to generate (default: 10)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Verify a backup code and mark it as used
 * @param userId - User ID
 * @param code - Backup code to verify
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.mfaBackupCodes) {
      return false;
    }

    const backupCodes = JSON.parse(user.mfaBackupCodes) as string[];
    const hashedCode = hashBackupCode(code);

    // Check if code exists
    const codeIndex = backupCodes.indexOf(hashedCode);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used code
    backupCodes.splice(codeIndex, 1);

    // Update user's backup codes
    await db
      .update(users)
      .set({ mfaBackupCodes: JSON.stringify(backupCodes) })
      .where(eq(users.id, userId));

    console.log(`[MFA] Backup code used for user ${userId}`);
    return true;
  } catch (error) {
    console.error("[MFA] Error verifying backup code:", error);
    return false;
  }
}

/**
 * Enable MFA for a user
 * @param userId - User ID
 * @param secret - TOTP secret
 * @param backupCodes - Array of backup codes (will be hashed)
 */
export async function enableMFA(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  const hashedCodes = backupCodes.map(hashBackupCode);

  await db
    .update(users)
    .set({
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: JSON.stringify(hashedCodes),
    })
    .where(eq(users.id, userId));

  console.log(`[MFA] Enabled for user ${userId}`);
}

/**
 * Disable MFA for a user
 * @param userId - User ID
 */
export async function disableMFA(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
    })
    .where(eq(users.id, userId));

  console.log(`[MFA] Disabled for user ${userId}`);
}

/**
 * Check if user has MFA enabled
 * @param userId - User ID
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ mfaEnabled: users.mfaEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.mfaEnabled || false;
}

/**
 * Get user's TOTP secret (for verification)
 * @param userId - User ID
 */
export async function getUserTOTPSecret(
  userId: string
): Promise<string | null> {
  const [user] = await db
    .select({ mfaSecret: users.mfaSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.mfaSecret || null;
}
