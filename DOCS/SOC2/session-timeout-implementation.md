# Session Timeout Implementation

## Overview

This document describes the automatic session timeout implementation for SOC2 compliance. The system enforces session timeouts to protect against unauthorized access from unattended sessions.

## Requirements

SOC2 requires:

- Automatic session termination after a period of inactivity
- Warning to users before session expires
- Ability for users to extend their session
- Logging of session timeout events

## Implementation

### Configuration

Session timeout settings are defined in `/src/lib/session-config.ts`:

```typescript
// Session timeout after 30 minutes of inactivity
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Warn user 2 minutes before session expires
export const SESSION_WARNING_MS = 2 * 60 * 1000; // 2 minutes

// Maximum session duration (absolute timeout)
export const MAX_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
```

### Server-Side Implementation

#### Middleware (`/src/middleware.ts`)

The middleware tracks session activity and enforces timeouts:

1. **Activity Tracking**: Updates `session_timestamp` cookie on each request
2. **Inactivity Check**: Compares current time with last activity timestamp
3. **Maximum Duration Check**: Ensures sessions don't exceed 12 hours
4. **Automatic Logout**: Redirects to login with `?timeout=true` parameter when session expires

#### Session Cookies

Three cookies are used for session management:

- `session_user`: Contains user email and ID (existing)
- `session_timestamp`: Last activity timestamp (new)
- `session_created`: Session creation timestamp (new)

All cookies are:

- HttpOnly (not accessible via JavaScript)
- Secure (HTTPS only in production)
- SameSite: Lax
- MaxAge: 7 days

#### Login Actions

Updated to set initial session timestamps:

- `/src/app/login/actions.ts` - Standard login
- `/src/app/login/verify/actions.ts` - MFA completion

#### Logout Action

Updated to clear all session cookies including timestamps (`/src/actions/auth.ts`).

### Client-Side Implementation

#### Session Timeout Warning (`/src/components/SessionTimeoutWarning.tsx`)

A React component that:

- Monitors user activity (mouse, keyboard, scroll, touch)
- Shows warning modal 2 minutes before timeout
- Displays countdown timer
- Provides "Continue Session" and "Logout" buttons
- Automatically logs out when timer reaches zero

Features:

- Resets timers on user activity
- Only shows warning when inactive
- Graceful handling of session extension

#### Session Extension API (`/src/app/api/extend-session/route.ts`)

POST endpoint that:

- Verifies active session exists
- Updates `session_timestamp` cookie
- Returns success with new timestamp

#### Login Page Updates (`/src/app/login/page.tsx`)

Enhanced to:

- Detect `?timeout=true` parameter
- Display session expiration message
- Auto-hide message after 10 seconds
- Allow manual dismissal

### User Experience

#### Normal Flow

1. User logs in → session timestamps are set
2. User navigates pages → timestamps update automatically
3. User remains active → session stays alive

#### Inactivity Flow

1. User inactive for 28 minutes
2. Warning modal appears with 2-minute countdown
3. User can:
   - Click "Continue Session" → timestamps reset, modal closes
   - Click "Logout" → immediate logout
   - Do nothing → automatic logout after 2 minutes
4. After logout → redirect to login with timeout message

#### Maximum Duration Flow

1. User active for 12 hours
2. Next request triggers automatic logout
3. Redirect to login with timeout message

## Testing

### E2E Tests (`/e2e-tests/logged-in/session-timeout.spec.ts`)

Tests cover:

1. **Inactivity Timeout**: Session expires after 30 minutes of inactivity
2. **Maximum Duration**: Session expires after 12 hours regardless of activity
3. **Activity Tracking**: Timestamp updates on page navigation
4. **Session Extension**: API endpoint works correctly
5. **Unauthorized Access**: Extension API requires authentication
6. **Session Persistence**: Session maintained across navigations

### Manual Testing

1. **Test Inactivity Timeout**:

   - Login and wait 30 minutes
   - Navigate to any page
   - Should redirect to login with timeout message

2. **Test Warning Modal**:

   - Temporarily reduce `SESSION_TIMEOUT_MS` to 3 minutes in config
   - Login and wait 1 minute
   - Warning modal should appear
   - Click "Continue Session"
   - Modal should close and session should extend

3. **Test Maximum Duration**:
   - Temporarily reduce `MAX_SESSION_DURATION_MS` to 5 minutes
   - Login and actively use the app for 5 minutes
   - Next navigation should trigger logout

## Security Considerations

### Strengths

- ✅ Server-side enforcement (cannot be bypassed by client)
- ✅ HttpOnly cookies (protected from XSS)
- ✅ Dual timeout mechanism (inactivity + maximum duration)
- ✅ Activity tracking on every request
- ✅ Clear user communication

### Limitations

- ⚠️ Client-side warning can be disabled (but server still enforces timeout)
- ⚠️ Session extension requires user interaction (by design)

## Compliance Mapping

| SOC2 Requirement          | Implementation                     |
| ------------------------- | ---------------------------------- |
| Automatic session timeout | ✅ 30-minute inactivity timeout    |
| User notification         | ✅ Warning modal with countdown    |
| Session extension         | ✅ One-click extension via API     |
| Maximum session duration  | ✅ 12-hour absolute limit          |
| Audit logging             | ✅ Console logs for timeout events |

## Configuration Options

To adjust timeout settings, modify `/src/lib/session-config.ts`:

```typescript
// For stricter security (15-minute timeout)
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

// For longer sessions (8-hour max)
export const MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// For earlier warning (5 minutes before)
export const SESSION_WARNING_MS = 5 * 60 * 1000;
```

**Note**: Changes require application rebuild and restart.

## Troubleshooting

### Issue: Session expires too quickly

- Check `SESSION_TIMEOUT_MS` value
- Verify middleware is updating timestamps
- Check browser console for errors

### Issue: Warning modal doesn't appear

- Verify `SessionTimeoutWarning` component is in layout
- Check browser console for JavaScript errors
- Ensure user is authenticated

### Issue: Session doesn't extend

- Check `/api/extend-session` endpoint response
- Verify cookies are being set correctly
- Check network tab for failed requests

## Future Enhancements

Potential improvements:

- [ ] Add session timeout to audit logs
- [ ] Configurable timeout per user role
- [ ] Remember user preference for session duration
- [ ] Mobile app support with background timeout
- [ ] Admin dashboard for session monitoring
