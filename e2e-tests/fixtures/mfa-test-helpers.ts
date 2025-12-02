import { authenticator } from "otplib";
import { db } from "../../src/db/connect";
import { users } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

/**
 * Generate a valid TOTP code for testing
 */
export function generateTestTOTPCode(secret: string): string {
  return authenticator.generate(secret);
}

/**
 * Hash a backup code for storage
 */
function hashBackupCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Enable MFA for a test user with a known secret
 */
export async function enableMFAForTestUser(
  userId: string,
  secret: string = "JBSWY3DPEHPK3PXP", // Base32 encoded test secret
  backupCodes: string[] = ["TESTCODE1", "TESTCODE2", "TESTCODE3"]
): Promise<{ secret: string; backupCodes: string[] }> {
  const hashedCodes = backupCodes.map(hashBackupCode);

  await db
    .update(users)
    .set({
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: JSON.stringify(hashedCodes),
    })
    .where(eq(users.id, userId));

  console.log(`[MFA Test] Enabled MFA for user ${userId}`);
  return { secret, backupCodes };
}

/**
 * Disable MFA for a test user
 */
export async function disableMFAForTestUser(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
    })
    .where(eq(users.id, userId));

  console.log(`[MFA Test] Disabled MFA for user ${userId}`);
}

/**
 * Check if user has MFA enabled
 */
export async function checkMFAStatus(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ mfaEnabled: users.mfaEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.mfaEnabled || false;
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  const [user] = await db
    .select({ mfaBackupCodes: users.mfaBackupCodes })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.mfaBackupCodes) {
    return 0;
  }

  const codes = JSON.parse(user.mfaBackupCodes) as string[];
  return codes.length;
}
