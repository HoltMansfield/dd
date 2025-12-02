# MFA UI Implementation Guide

## Overview

This guide describes the UI components for the TOTP-based MFA system and how to integrate them into your application.

## Components

### 1. MFASetup (`src/components/MFASetup.tsx`)

Multi-step wizard for enabling MFA on a user account.

**Steps:**

1. **Intro** - Explains MFA and what's needed
2. **Scan** - Displays QR code for authenticator app
3. **Verify** - User enters code to confirm setup
4. **Backup** - Shows 10 backup codes to save

**Props:**

```typescript
interface MFASetupProps {
  onComplete?: () => void; // Called when setup is complete
  onCancel?: () => void; // Called when user cancels
}
```

**Usage:**

```tsx
<MFASetup
  onComplete={() => router.push("/settings/security")}
  onCancel={() => setShowSetup(false)}
/>
```

### 2. MFAVerification (`src/components/MFAVerification.tsx`)

Login verification component for users with MFA enabled.

**Features:**

- 6-digit TOTP code input
- Backup code option
- Skip button (LOCAL environment only)
- Auto-submit on Enter key

**Props:**

```typescript
interface MFAVerificationProps {
  userId: string; // User ID for verification
  onSuccess: () => void; // Called on successful verification
  onCancel?: () => void; // Called when user skips (LOCAL only)
}
```

**Usage:**

```tsx
<MFAVerification
  userId={userId}
  onSuccess={() => router.push("/dashboard")}
  onCancel={() => proceedWithoutMFA()}
/>
```

### 3. SecuritySettings (`src/app/settings/security/`)

Full security settings page with MFA management.

**Features:**

- Enable/disable MFA
- View MFA status
- Password confirmation for disable
- Placeholder for password change and session management

**Route:** `/settings/security`

## Environment Configuration

### LOCAL Environment Behavior

When `NEXT_PUBLIC_APP_ENV=LOCAL`:

✅ **MFA is optional**

- Users can skip MFA verification during login
- "Skip for now (development mode)" button appears
- Setup shows "optional in development mode" message

### Production Environment Behavior

When `NEXT_PUBLIC_APP_ENV` is anything else:

🔒 **MFA is enforced**

- No skip option during verification
- Users with MFA enabled must verify
- Setup shows "recommended for enhanced security" message

## Integration Steps

### Step 1: Add to Login Flow

Modify your login action to check for MFA:

```typescript
// In your login action
const user = await authenticateUser(email, password);

if (user.mfaEnabled) {
  // Store userId in session/state
  // Redirect to MFA verification page
  return { requiresMFA: true, userId: user.id };
}

// Normal login flow
return { success: true };
```

### Step 2: Create MFA Verification Page

```tsx
// app/login/verify/page.tsx
import MFAVerification from "@/components/MFAVerification";

export default function MFAVerifyPage({ searchParams }) {
  const userId = searchParams.userId;

  return (
    <MFAVerification
      userId={userId}
      onSuccess={() => router.push("/dashboard")}
      onCancel={() => router.push("/dashboard")} // LOCAL only
    />
  );
}
```

### Step 3: Add Link to Security Settings

Add a link in your navigation or user menu:

```tsx
<Link href="/settings/security">Security Settings</Link>
```

### Step 4: Update Login Component

```tsx
const handleLogin = async (email: string, password: string) => {
  const result = await loginAction(email, password);

  if (result.requiresMFA) {
    router.push(`/login/verify?userId=${result.userId}`);
  } else if (result.success) {
    router.push("/dashboard");
  }
};
```

## Styling

All components use Tailwind CSS with a clean, modern design:

- **Primary Color**: Blue (blue-600)
- **Success Color**: Green (green-600)
- **Warning Color**: Yellow (yellow-50/800)
- **Danger Color**: Red (red-600)
- **Neutral**: Gray scale

### Customization

To match your brand:

1. Update color classes in components
2. Adjust spacing/sizing as needed
3. Modify shadow/border styles

## User Experience

### MFA Setup Flow

1. User clicks "Enable MFA" in security settings
2. Modal/page shows intro with requirements
3. User clicks "Get Started"
4. QR code is displayed
5. User scans with authenticator app
6. User enters verification code
7. Backup codes are displayed
8. User downloads/saves backup codes
9. MFA is enabled

**Time to complete:** ~2-3 minutes

### Login Flow with MFA

1. User enters email/password
2. If MFA enabled, verification screen appears
3. User enters 6-digit code from app
4. User is logged in

**Time to complete:** ~10 seconds

### Using Backup Code

1. On verification screen, click "Use backup code instead"
2. Enter 8-character backup code
3. Code is validated and removed from available codes
4. User is logged in

## Testing Checklist

### Manual Testing

- [ ] Enable MFA in LOCAL environment (should be optional)
- [ ] Enable MFA in production environment
- [ ] Scan QR code with Google Authenticator
- [ ] Verify with TOTP code
- [ ] Download backup codes
- [ ] Login with TOTP code
- [ ] Login with backup code
- [ ] Verify backup code is removed after use
- [ ] Disable MFA with password
- [ ] Skip MFA in LOCAL environment
- [ ] Verify skip button doesn't appear in production

### Authenticator Apps to Test

- ✅ Google Authenticator (iOS/Android)
- ✅ Authy (iOS/Android/Desktop)
- ✅ Microsoft Authenticator (iOS/Android)
- ✅ 1Password (with TOTP support)
- ✅ Bitwarden (with TOTP support)

## Troubleshooting

### QR Code Not Scanning

**Solution:** Provide manual entry code

- Code is displayed below QR code
- User can type it into authenticator app manually

### Code Not Working

**Possible causes:**

1. Clock drift - Check device time synchronization
2. Wrong code - Codes expire every 30 seconds
3. Already used - Each code can only be used once

**Solution:** Wait for next code or use backup code

### Lost Authenticator App

**Solution:** Use backup codes

- Each user has 10 backup codes
- Each code works once
- Recommend storing in password manager

### Locked Out

**Solution:** Contact support

- Admin can disable MFA for user
- User can re-enable with new setup

## Security Considerations

### Best Practices Implemented

✅ **Secure Storage**

- TOTP secrets stored in database
- Backup codes hashed before storage
- Used codes immediately removed

✅ **User Experience**

- Clear instructions at each step
- Visual feedback for success/error
- Download option for backup codes

✅ **Environment Awareness**

- Optional in LOCAL for development
- Enforced in production for security
- Clear messaging about enforcement

### Recommendations

1. **Backup Code Storage**

   - Encourage users to store in password manager
   - Warn about single-use nature
   - Provide download option

2. **Recovery Process**

   - Document support process for lockouts
   - Consider email recovery option
   - Admin tools for MFA reset

3. **User Education**
   - Explain benefits of MFA
   - Show how to use authenticator apps
   - Provide troubleshooting guide

## Next Steps

### Phase 2 Enhancements

- [ ] Add MFA reminder notifications
- [ ] Implement trusted device management
- [ ] Add "Remember this device for 30 days"
- [ ] Create admin panel for MFA management
- [ ] Add MFA enforcement policies
- [ ] Implement recovery email option

### Phase 3 Advanced Features

- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] SMS backup option (via Twilio)
- [ ] Email backup option (via Resend)
- [ ] Biometric authentication
- [ ] Risk-based authentication

## References

- [MFA Implementation Docs](./mfa-implementation.md)
- [SOC2 Checklist](./checklist.md)
- [OWASP MFA Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

---

**Document Version**: 1.0  
**Created**: December 1, 2024  
**Author**: Development Team
