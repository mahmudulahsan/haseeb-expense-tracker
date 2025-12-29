# Authentication System - Quick Reference Guide

## 🚀 Quick Start

### For Developers

**1. Environment Setup**
```bash
# Required environment variables
JWT_SECRET=<generate-with-openssl-rand-base64-32>
RESEND_API_KEY=<your-resend-api-key>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**2. Database Tables**
```sql
-- profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- auth_otps table
CREATE TABLE auth_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recommended indexes
CREATE INDEX idx_auth_otps_email ON auth_otps(email);
CREATE INDEX idx_auth_otps_expires_at ON auth_otps(expires_at);
```

---

## 📋 API Reference

### Send OTP
```typescript
POST /api/auth/otp/send

Request:
{
  "email": "user@example.com",
  "allowForgot": false  // optional
}

Response:
{ "success": true } | { "passwordRequired": true } | { "error": "..." }
```

### Verify OTP
```typescript
POST /api/auth/otp/verify

Request:
{
  "email": "user@example.com",
  "code": "123456",
  "isForgot": false  // optional
}

Response:
{ "success": true, "needsPassword": true } | { "success": true } | { "error": "..." }
```

### Logout
```typescript
POST /auth/signout

Response:
Redirect to /login
```

---

## 🔧 Server Actions

### Set Password
```typescript
import { setPassword } from "@/app/actions/auth";

const formData = new FormData();
formData.append("email", email);
formData.append("password", password);
formData.append("confirmPassword", confirmPassword);

const result = await setPassword(formData);
// Returns: { success: true } | { error: "..." }
```

### Login with Password
```typescript
import { loginWithPassword } from "@/app/actions/auth";

const formData = new FormData();
formData.append("email", email);
formData.append("password", password);

const result = await loginWithPassword(formData);
// Returns: { success: true } | { error: "..." }
```

### Change Password
```typescript
import { changePassword } from "@/app/actions/auth";

const formData = new FormData();
formData.append("currentPassword", currentPassword);
formData.append("newPassword", newPassword);
formData.append("confirmPassword", confirmPassword);

const result = await changePassword(formData);
// Returns: { success: true } | { error: "..." }
```

---

## 🔐 Session Management

### Get Current Session
```typescript
import { getSession } from "@/lib/auth";

const session = await getSession();
// Returns: { user: { id: string, email: string }, expires: Date } | null
```

### Login User
```typescript
import { login } from "@/lib/auth";

await login({ id: userId, email: userEmail });
// Creates JWT session cookie
```

### Logout User
```typescript
import { logout } from "@/lib/auth";

await logout();
// Clears session cookie
```

---

## 🛡️ Middleware Protection

### Protected Routes
All routes except:
- `/login`
- `/api/auth/otp/send`
- `/api/auth/otp/verify`
- Static files (`_next/static`, `_next/image`, images)

### Behavior
- **Unauthenticated** → Redirect to `/login`
- **Authenticated on /login** → Redirect to `/dashboard`
- **Authenticated on protected routes** → Allow access

---

## 📊 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ENTERS EMAIL                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  Check Password Hash   │
                │    in Database         │
                └────────┬───────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
   ┌────────────────┐        ┌────────────────┐
   │  Has Password  │        │  No Password   │
   └────────┬───────┘        └────────┬───────┘
            │                         │
            ▼                         ▼
   ┌────────────────┐        ┌────────────────┐
   │ Password Login │        │   Send OTP     │
   │     Screen     │        │   via Email    │
   └────────┬───────┘        └────────┬───────┘
            │                         │
            ▼                         ▼
   ┌────────────────┐        ┌────────────────┐
   │ Verify Password│        │  Verify OTP    │
   └────────┬───────┘        └────────┬───────┘
            │                         │
            │                         ▼
            │                ┌────────────────┐
            │                │ Password Set?  │
            │                └────────┬───────┘
            │                         │
            │                    ┌────┴────┐
            │                    │         │
            │                    ▼         ▼
            │           ┌─────────────┐   │
            │           │Set Password │   │
            │           │   Screen    │   │
            │           └──────┬──────┘   │
            │                  │          │
            └──────────────────┴──────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Create JWT Session│
                    └──────────┬────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Redirect to      │
                    │   Dashboard      │
                    └──────────────────┘
```

---

## 🎯 Common Patterns

### Protect a Server Component
```typescript
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  return <div>Protected content for {session.user.email}</div>;
}
```

### Protect a Server Action
```typescript
"use server";

import { getSession } from "@/lib/auth";

export async function protectedAction() {
  const session = await getSession();
  
  if (!session) {
    return { error: "Unauthorized" };
  }
  
  // Your protected logic here
  const userId = session.user.id;
  // ...
}
```

### Check Auth in Client Component
```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientComponent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setUser(data.user);
      }
    }
    checkAuth();
  }, []);
  
  if (!user) return <div>Loading...</div>;
  
  return <div>Hello {user.email}</div>;
}
```

---

## 🐛 Debugging Tips

### Check Session Cookie
```typescript
// In browser console
document.cookie.split(';').find(c => c.includes('session'))
```

### Verify JWT
```typescript
import { decrypt } from "@/lib/auth";

const session = await decrypt(cookieValue);
console.log(session);
```

### Check OTP in Database
```sql
SELECT * FROM auth_otps WHERE email = 'user@example.com';
```

### Check User Profile
```sql
SELECT id, email, password_hash IS NOT NULL as has_password 
FROM profiles 
WHERE email = 'user@example.com';
```

---

## ⚠️ Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid or expired code" | OTP expired or wrong | Request new OTP |
| "Failed to send email" | Resend API key invalid | Check RESEND_API_KEY |
| "Unauthorized" | No session | Login again |
| "Invalid email or password" | Wrong credentials | Check email/password |
| Session expires quickly | JWT_SECRET changed | Don't change JWT_SECRET |
| Redirect loop | Middleware misconfigured | Check middleware.ts |

---

## 📈 Performance Tips

1. **Session Caching**: Session is validated on every request via middleware
2. **OTP Cleanup**: Add cron job to delete expired OTPs
3. **Database Indexes**: Ensure indexes on `email` fields
4. **Rate Limiting**: Add rate limiting to prevent abuse

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (10 rounds)
- [x] JWT with HS256 algorithm
- [x] httpOnly cookies (prevents XSS)
- [x] 7-day session expiration
- [x] 10-minute OTP expiration
- [x] Single-use OTPs
- [x] Server-side validation
- [x] Middleware route protection
- [ ] Rate limiting (recommended)
- [ ] Account lockout (recommended)
- [ ] 2FA support (recommended)
- [ ] CSRF protection (recommended)

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | JWT session management |
| `app/api/auth/otp/send/route.ts` | Send OTP endpoint |
| `app/api/auth/otp/verify/route.ts` | Verify OTP endpoint |
| `app/actions/auth.ts` | Password auth actions |
| `app/(auth)/login/page.tsx` | Login UI |
| `app/auth/signout/route.ts` | Logout endpoint |
| `middleware.ts` | Route protection |
| `lib/supabase/admin.ts` | Admin Supabase client |
| `lib/supabase/server.ts` | Server Supabase client |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/resend.ts` | Email service |

---

## 🎓 Learning Resources

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [JWT Introduction](https://jwt.io/introduction)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2025-12-29
