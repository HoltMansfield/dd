"use server";

import { getCurrentUserId } from "./auth";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  enableMFA,
  disableMFA,
  isMFAEnabled,
  getUserTOTPSecret,
  verifyBackupCode,
} from "../lib/mfa";
import { createAuditLog } from "../lib/audit";

/**
 * Initialize MFA setup - generates secret and QR code
 */
export async function initializeMFASetup(): Promise<{
  success: boolean;
  secret?: string;
  qrCode?: string;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if MFA is already enabled
    const mfaEnabled = await isMFAEnabled(userId);
    if (mfaEnabled) {
      return { success: false, error: "MFA is already enabled" };
    }

    // Generate new secret
    const secret = generateTOTPSecret();

    // Get user email for QR code
    const { db } = await import("../db/connect");
    const { users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.email) {
      return { success: false, error: "User email not found" };
    }

    // Generate QR code
    const qrCode = await generateQRCode(user.email, secret, "DD");

    await createAuditLog({
      userId,
      action: "mfa_setup_initiated",
      success: true,
      metadata: { email: user.email },
    });

    return { success: true, secret, qrCode };
  } catch (error) {
    console.error("[MFA] Error initializing setup:", error);
    return { success: false, error: "Failed to initialize MFA setup" };
  }
}

/**
 * Complete MFA setup - verify token and enable MFA
 */
export async function completeMFASetup(
  secret: string,
  token: string
): Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify the token
    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      await createAuditLog({
        userId,
        action: "mfa_setup_failed",
        success: false,
        errorMessage: "Invalid verification code",
      });
      return { success: false, error: "Invalid verification code" };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Enable MFA
    await enableMFA(userId, secret, backupCodes);

    await createAuditLog({
      userId,
      action: "mfa_enabled",
      success: true,
      metadata: { backupCodesGenerated: backupCodes.length },
    });

    return { success: true, backupCodes };
  } catch (error) {
    console.error("[MFA] Error completing setup:", error);
    return { success: false, error: "Failed to complete MFA setup" };
  }
}

/**
 * Verify MFA token during login
 */
export async function verifyMFAToken(
  userId: string,
  token: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get user's secret
    const secret = await getUserTOTPSecret(userId);
    if (!secret) {
      return { success: false, error: "MFA not configured" };
    }

    // Verify token
    const isValid = verifyTOTP(token, secret);

    await createAuditLog({
      userId,
      action: "mfa_verification",
      success: isValid,
      errorMessage: isValid ? undefined : "Invalid MFA token",
    });

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    return { success: true };
  } catch (error) {
    console.error("[MFA] Error verifying token:", error);
    return { success: false, error: "Failed to verify MFA token" };
  }
}

/**
 * Verify backup code during login
 */
export async function verifyMFABackupCode(
  userId: string,
  code: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const isValid = await verifyBackupCode(userId, code);

    await createAuditLog({
      userId,
      action: "mfa_backup_code_used",
      success: isValid,
      errorMessage: isValid ? undefined : "Invalid backup code",
    });

    if (!isValid) {
      return { success: false, error: "Invalid backup code" };
    }

    return { success: true };
  } catch (error) {
    console.error("[MFA] Error verifying backup code:", error);
    return { success: false, error: "Failed to verify backup code" };
  }
}

/**
 * Disable MFA for current user
 */
export async function disableMFAAction(password: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify password before disabling MFA
    const { db } = await import("../db/connect");
    const { users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");
    const bcrypt = await import("bcryptjs");

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.passwordHash) {
      return { success: false, error: "User not found" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await createAuditLog({
        userId,
        action: "mfa_disable_failed",
        success: false,
        errorMessage: "Invalid password",
      });
      return { success: false, error: "Invalid password" };
    }

    // Disable MFA
    await disableMFA(userId);

    await createAuditLog({
      userId,
      action: "mfa_disabled",
      success: true,
    });

    return { success: true };
  } catch (error) {
    console.error("[MFA] Error disabling MFA:", error);
    return { success: false, error: "Failed to disable MFA" };
  }
}

/**
 * Check if current user has MFA enabled
 */
export async function checkMFAStatus(): Promise<{
  enabled: boolean;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { enabled: false, error: "Not authenticated" };
    }

    const enabled = await isMFAEnabled(userId);
    return { enabled };
  } catch (error) {
    console.error("[MFA] Error checking MFA status:", error);
    return { enabled: false, error: "Failed to check MFA status" };
  }
}
