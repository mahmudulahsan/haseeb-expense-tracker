# Authentication System Documentation

## Overview

The Haseeb expense tracker application implements a **custom JWT-based authentication system** with **OTP (One-Time Password) email verification** and **password-based login**. The system is built on top of Supabase for database operations but uses custom authentication logic instead of Supabase Auth.

## Architecture

### Core Components

1. **JWT Session Management** (`lib/auth.ts`)
2. **OTP Email Verification** (`app/api/auth/otp/`)
3. **Password Authentication** (`app/actions/auth.ts`)
4. **Middleware Protection** (`middleware.ts`)
5. **Database Tables**: `profiles`, `auth_otps`

---

## Authentication Flow

### 1. Initial Login Flow

```
User enters email
    ↓
System checks if user has password set
    ↓
┌─────────────────────────────────────┐
│  Has Password?                      │
├─────────────────────────────────────┤
│ YES → Password Login Screen         │
│ NO  → Send OTP to Email             │
└─────────────────────────────────────┘
    ↓
OTP Verification
    ↓
┌─────────────────────────────────────┐
│  Password Set?                      │
├─────────────────────────────────────┤
│ YES → Login Success                 │
│ NO  → Set Password Screen           │
└─────────────────────────────────────┘
    ↓
JWT Session Created
    ↓
Redirect to Dashboard
```

### 2. Forgot Password Flow

```
User clicks "Forgot Password"
    ↓
Send OTP with allowForgot=true flag
    ↓
Verify OTP
    ↓
Set New Password Screen
    ↓
Password Updated & Login
    ↓
Redirect to Dashboard
```

---

## Technical Implementation

### 1. JWT Session Management (`lib/auth.ts`)

#### **Session Encryption**
```typescript
export async function encrypt(payload: any)
```
- Uses **HS256 algorithm** (HMAC with SHA-256)
- **Expiration**: 7 days
- Stores user ID and email in JWT payload
- Secret key from `JWT_SECRET` environment variable

#### **Session Decryption**
```typescript
export async function decrypt(input: string): Promise<any>
```
- Verifies JWT signature
- Returns payload or null if invalid/expired

#### **Login**
```typescript
export async function login(user: { id: string; email: string })
```
- Creates encrypted JWT session
- Sets **httpOnly** cookie named `session`
- Cookie expires in 7 days

#### **Logout**
```typescript
export async function logout()
```
- Clears session cookie by setting expiration to past date

#### **Get Session**
```typescript
export async function getSession()
```
- Retrieves and decrypts current session
- Returns user data or null

#### **Update Session**
```typescript
export async function updateSession(request: NextRequest)
```
- Refreshes session expiration on each request
- Prevents session timeout during active usage

---

### 2. OTP Email Verification

#### **Send OTP** (`app/api/auth/otp/send/route.ts`)

**Endpoint**: `POST /api/auth/otp/send`

**Request Body**:
```json
{
  "email": "user@example.com",
  "allowForgot": false  // Optional, true for password reset
}
```

**Process**:
1. Check if user exists in `profiles` table
2. If user has `password_hash` and `allowForgot=false`, return `passwordRequired: true`
3. Generate 6-digit OTP code
4. Delete old OTPs for this email
5. Store new OTP in `auth_otps` table with 10-minute expiration
6. Send OTP via Resend email service
7. Return success response

**Response**:
```json
// User needs password
{ "passwordRequired": true }

// OTP sent successfully
{ "success": true }

// Error
{ "error": "Error message" }
```

**Email Template**:
- Branded HTML email with Haseeb logo
- 6-digit OTP code prominently displayed
- 10-minute expiration notice
- Sent from: `Haseeb <onboarding@resend.dev>`

#### **Verify OTP** (`app/api/auth/otp/verify/route.ts`)

**Endpoint**: `POST /api/auth/otp/verify`

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "isForgot": false  // Optional, true for password reset flow
}
```

**Process**:
1. Verify OTP code matches and hasn't expired
2. Get or create user profile
3. Delete used OTP
4. If no password set OR `isForgot=true`, return `needsPassword: true`
5. Otherwise, create session and login user

**Response**:
```json
// Needs to set password
{ "success": true, "needsPassword": true }

// Login successful
{ "success": true }

// Error
{ "error": "Invalid or expired code" }
```

---

### 3. Password Authentication (`app/actions/auth.ts`)

#### **Set Password**
```typescript
export async function setPassword(formData: FormData)
```

**Server Action** - Used for:
- First-time password setup
- Password reset after OTP verification

**Validation**:
- Password must be at least 6 characters
- Password and confirmPassword must match

**Process**:
1. Hash password using bcrypt (10 salt rounds)
2. Update `profiles.password_hash`
3. Create session and login user
4. Return success or error

#### **Login with Password**
```typescript
export async function loginWithPassword(formData: FormData)
```

**Server Action** - Standard password login

**Process**:
1. Fetch user from `profiles` by email
2. Verify password using bcrypt.compare()
3. Create session if password matches
4. Return success or error

#### **Change Password**
```typescript
export async function changePassword(formData: FormData)
```

**Server Action** - For authenticated users to change password

**Validation**:
- Requires active session
- Verifies current password if user has one
- New password must be at least 6 characters
- New password and confirm must match

**Process**:
1. Verify session exists
2. Verify current password (if provided)
3. Hash new password
4. Update `profiles.password_hash`
5. Return success or error

---

### 4. Middleware Protection (`middleware.ts`)

**Purpose**: Protect routes and manage authentication redirects

**Public Paths** (No authentication required):
- `/login`
- `/api/auth/otp/send`
- `/api/auth/otp/verify`

**Protected Paths**: All other routes

**Logic**:
```typescript
if (!session && !isPublicPath) {
    // Redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
}

if (session && isPublicPath && pathname === "/login") {
    // Already logged in, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

**Matcher Configuration**:
- Excludes: `_next/static`, `_next/image`, `favicon.ico`, image files
- Applies to all other routes

---

### 5. Logout (`app/auth/signout/route.ts`)

**Endpoint**: `POST /auth/signout`

**Process**:
1. Call `logout()` to clear session cookie
2. Redirect to `/login` page

---

## Database Schema
 
 The database schema is managed using **Drizzle ORM** in `db/schema.ts`.
 
 ### Tables
 
 | Table | Description |
 |-------|-------------|
 | `profiles` | User profiles and authentication data |
 | `auth_otps` | Temporary one-time passwords for login/reset |
 | `accounts` | Financial accounts (Wallet, Bank, etc.) |
 | `categories` | Transaction categories |
 | `expenses` | All transactions (Income and Expenses) |
 | `ai_insights` | AI-generated financial insights cache |
 
 ### Migration Management
 
 To update the database schema:
 
 1. Modify `db/schema.ts`
 2. Run `npm run db:generate` to create a new migration
 3. Run `npm run db:push` to apply changes to the database
 
 For production, it's recommended to use the generated SQL files in the `./drizzle` folder.
 
 ---


## Supabase Clients

### 1. Admin Client (`lib/supabase/admin.ts`)

**Purpose**: Server-side operations with elevated privileges

**Configuration**:
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- `autoRefreshToken: false`
- `persistSession: false`

**Used For**:
- User creation
- Password management
- OTP operations

### 2. Server Client (`lib/supabase/server.ts`)

**Purpose**: Server-side operations with user context

**Configuration**:
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Cookie-based session management
- Used in Server Components and Server Actions

### 3. Browser Client (`lib/supabase/client.ts`)

**Purpose**: Client-side operations

**Configuration**:
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Browser-based client for Client Components

---

## Security Features

### 1. **Password Security**
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Length**: 6 characters
- **Validation**: Server-side validation for all password operations

### 2. **JWT Security**
- **Algorithm**: HS256 (HMAC-SHA256)
- **HttpOnly Cookies**: Prevents XSS attacks
- **Expiration**: 7-day sessions with auto-refresh
- **Secret Key**: Environment variable (`JWT_SECRET`)

### 3. **OTP Security**
- **6-digit codes**: 1 million possible combinations
- **10-minute expiration**: Limited time window
- **Single-use**: OTPs deleted after verification
- **Email-only**: OTPs cleared when new one requested

### 4. **Route Protection**
- **Middleware**: Automatic redirect for unauthenticated users
- **Session Validation**: Every request validates JWT
- **Public Path Whitelist**: Explicit list of unprotected routes

### 5. **Email Verification**
- **Resend Integration**: Professional email delivery
- **Branded Emails**: Custom HTML templates
- **Rate Limiting**: Recommended to add (not currently implemented)

---

## Environment Variables

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Mail Configuration
RESEND_API_KEY=re_your_api_key

# Authentication
JWT_SECRET=your-random-secret-key-min-32-chars

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Generate JWT Secret**:
```bash
openssl rand -base64 32
```

---

## User Interface Flow

### Login Page (`app/(auth)/login/page.tsx`)

**4-Step Process**:

1. **Step 1: Email Entry**
   - User enters email
   - System checks if password exists
   - Routes to Step 2 (OTP) or Step 4 (Password)

2. **Step 2: OTP Verification**
   - User enters 6-digit code
   - Code validated against database
   - Routes to Step 3 (Set Password) or Dashboard

3. **Step 3: Set Password**
   - New users or password reset
   - Password and confirmation fields
   - Creates session and redirects to Dashboard

4. **Step 4: Password Login**
   - Existing users with password
   - Password field
   - "Forgot Password" option (triggers OTP flow)
   - Login or redirect to Step 1

**Features**:
- Beautiful glassmorphic UI
- Real-time error display
- Loading states
- Responsive design
- Dark mode support

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/auth/otp/send` | POST | Send OTP to email | Public |
| `/api/auth/otp/verify` | POST | Verify OTP code | Public |
| `/auth/signout` | POST | Logout user | Protected |

## Server Actions Summary

| Action | Purpose | Authentication |
|--------|---------|----------------|
| `setPassword` | Set/reset password | Public (requires OTP verification) |
| `loginWithPassword` | Login with password | Public |
| `changePassword` | Change password | Protected (requires session) |

---

## Common Use Cases

### 1. New User Registration
1. User enters email → OTP sent
2. User verifies OTP
3. User sets password
4. Session created → Dashboard

### 2. Existing User Login (with password)
1. User enters email → Password screen shown
2. User enters password
3. Session created → Dashboard

### 3. Existing User Login (OTP only)
1. User enters email → OTP sent
2. User verifies OTP
3. Session created → Dashboard

### 4. Forgot Password
1. User enters email → Password screen
2. User clicks "Forgot Password"
3. OTP sent with `allowForgot=true`
4. User verifies OTP
5. User sets new password
6. Session created → Dashboard

### 5. Change Password (Authenticated)
1. User navigates to settings
2. User enters current password (if exists)
3. User enters new password
4. Password updated

### 6. Logout
1. User clicks logout
2. POST to `/auth/signout`
3. Session cleared → Redirect to login

---

## Error Handling

### Common Errors

**OTP Send**:
- `"Email is required"` - Missing email
- `"Failed to store OTP"` - Database error
- `"Failed to send email"` - Resend API error

**OTP Verify**:
- `"Email and code are required"` - Missing fields
- `"Invalid or expired code"` - Wrong OTP or expired
- `"Failed to create user"` - Database error

**Password Login**:
- `"Email and password are required"` - Missing fields
- `"Invalid email or password"` - Wrong credentials

**Set Password**:
- `"All fields are required"` - Missing fields
- `"Passwords do not match"` - Mismatch
- `"Password must be at least 6 characters"` - Too short
- `"Failed to set password"` - Database error

**Change Password**:
- `"Unauthorized"` - No session
- `"Current password is incorrect"` - Wrong current password
- `"Passwords do not match"` - Mismatch
- `"Password must be at least 6 characters"` - Too short
- `"Failed to update password"` - Database error

---

## Best Practices & Recommendations

### ✅ Current Strengths
- JWT-based sessions with httpOnly cookies
- bcrypt password hashing
- OTP expiration (10 minutes)
- Single-use OTPs
- Server-side validation
- Middleware route protection

### 🔧 Recommended Improvements

1. **Rate Limiting**
   - Add rate limiting to OTP send endpoint
   - Prevent brute force attacks on password login
   - Implement exponential backoff

2. **Account Lockout**
   - Lock account after N failed login attempts
   - Temporary lockout with cooldown period

3. **Email Verification**
   - Add email verification flag to profiles
   - Require verification before full access

4. **Session Management**
   - Add ability to view active sessions
   - Implement "logout all devices"
   - Track last login timestamp

5. **Password Strength**
   - Increase minimum password length to 8-12 characters
   - Add complexity requirements (uppercase, numbers, symbols)
   - Implement password strength meter

6. **Audit Logging**
   - Log all authentication events
   - Track failed login attempts
   - Monitor suspicious activity

7. **Two-Factor Authentication (2FA)**
   - Add optional TOTP-based 2FA
   - Backup codes for account recovery

8. **CSRF Protection**
   - Add CSRF tokens to forms
   - Validate tokens on server actions

9. **Database Cleanup**
   - Add cron job to delete expired OTPs
   - Archive old sessions

10. **Error Messages**
    - Use generic messages for security
    - Don't reveal if email exists in system
    - Log detailed errors server-side only

---

## Testing Checklist

### Manual Testing

- [ ] New user registration with OTP
- [ ] New user registration with password
- [ ] Existing user login with password
- [ ] Existing user login with OTP
- [ ] Forgot password flow
- [ ] Change password (authenticated)
- [ ] Logout functionality
- [ ] Session expiration (after 7 days)
- [ ] Session refresh on activity
- [ ] Invalid OTP handling
- [ ] Expired OTP handling
- [ ] Wrong password handling
- [ ] Middleware redirect (unauthenticated)
- [ ] Middleware redirect (authenticated to /login)
- [ ] Email delivery

### Security Testing

- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF attempts
- [ ] Session hijacking
- [ ] Brute force password attempts
- [ ] OTP brute force attempts
- [ ] JWT tampering
- [ ] Cookie manipulation

---

## Troubleshooting

### Issue: OTP not received
**Solutions**:
- Check Resend API key is valid
- Verify email address is correct
- Check spam/junk folder
- Check Resend dashboard for delivery status

### Issue: Session expires too quickly
**Solutions**:
- Check JWT_SECRET is set correctly
- Verify middleware is calling updateSession
- Check browser cookie settings

### Issue: "Unauthorized" errors
**Solutions**:
- Clear browser cookies
- Check session cookie exists
- Verify JWT_SECRET hasn't changed
- Check middleware configuration

### Issue: Password login not working
**Solutions**:
- Verify password_hash exists in database
- Check bcrypt comparison logic
- Verify password meets minimum requirements

---

## Migration Guide

### From Supabase Auth to Custom Auth

If migrating from Supabase Auth:

1. Export user data from Supabase Auth
2. Create `profiles` table
3. Migrate user emails
4. Send password reset emails to all users
5. Users set new passwords via OTP flow
6. Update all auth references in codebase

### Adding to Existing Project

1. Install dependencies:
   ```bash
   npm install jose bcryptjs @supabase/supabase-js @supabase/ssr resend
   ```

2. Create database tables (`profiles`, `auth_otps`)

3. Set environment variables

4. Copy authentication files:
   - `lib/auth.ts`
   - `lib/supabase/`
   - `app/api/auth/`
   - `app/actions/auth.ts`
   - `app/(auth)/login/`
   - `middleware.ts`

5. Update imports and references

6. Test thoroughly

---

## Conclusion

This authentication system provides a robust, secure, and user-friendly authentication experience for the Haseeb expense tracker. It combines the flexibility of OTP-based passwordless login with the familiarity of traditional password authentication, while maintaining high security standards through JWT sessions, bcrypt hashing, and comprehensive middleware protection.

The system is production-ready but can be enhanced with the recommended improvements for enterprise-grade security and user experience.

---

**Last Updated**: 2025-12-29  
**Version**: 1.0  
**Maintainer**: Haseeb Development Team
