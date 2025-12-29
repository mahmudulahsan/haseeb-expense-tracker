# Authentication Security Audit Checklist

This document provides a comprehensive security audit checklist for the Haseeb authentication system.

## 🔒 Current Security Status

### ✅ Implemented Security Features

#### Password Security
- [x] **bcrypt hashing** - Passwords hashed with bcrypt (10 salt rounds)
- [x] **Minimum length** - 6 characters minimum (consider increasing to 8-12)
- [x] **Server-side validation** - All password validation on server
- [x] **No plaintext storage** - Passwords never stored in plaintext
- [x] **Hash comparison** - Secure bcrypt.compare() for verification

#### Session Security
- [x] **JWT tokens** - Using jose library with HS256 algorithm
- [x] **httpOnly cookies** - Prevents XSS cookie theft
- [x] **7-day expiration** - Sessions expire after 7 days
- [x] **Auto-refresh** - Sessions refreshed on activity
- [x] **Secure secret** - JWT_SECRET from environment variable
- [x] **Server-side validation** - All session checks on server

#### OTP Security
- [x] **6-digit codes** - 1 million possible combinations
- [x] **10-minute expiration** - Limited time window
- [x] **Single-use** - OTPs deleted after verification
- [x] **Email delivery** - Sent via Resend service
- [x] **Database cleanup** - Old OTPs cleared when new one sent

#### Route Protection
- [x] **Middleware** - Automatic route protection
- [x] **Public path whitelist** - Explicit list of unprotected routes
- [x] **Redirect logic** - Proper redirects for auth/unauth users
- [x] **Session validation** - Every request validates JWT

#### API Security
- [x] **Server-side validation** - All inputs validated
- [x] **Error handling** - Proper error responses
- [x] **Type safety** - TypeScript for type checking
- [x] **Admin client** - Separate admin Supabase client

---

## ⚠️ Recommended Security Improvements

### High Priority

#### 1. Rate Limiting
**Status**: ❌ Not Implemented  
**Risk Level**: High  
**Impact**: Prevents brute force attacks

**Implementation**:
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
});

// In OTP send endpoint
const { success } = await ratelimit.limit(email);
if (!success) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
```

**Endpoints to protect**:
- `/api/auth/otp/send` - 5 requests per 15 minutes per email
- `/api/auth/otp/verify` - 10 attempts per 15 minutes per email
- Password login - 5 attempts per 15 minutes per email

#### 2. Account Lockout
**Status**: ❌ Not Implemented  
**Risk Level**: High  
**Impact**: Prevents brute force password attacks

**Implementation**:
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN locked_until TIMESTAMP;
```

```typescript
// In loginWithPassword
if (user.locked_until && new Date(user.locked_until) > new Date()) {
  return { error: "Account temporarily locked. Try again later." };
}

if (user.failed_login_attempts >= 5) {
  await supabase
    .from("profiles")
    .update({ 
      locked_until: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    })
    .eq("id", user.id);
  return { error: "Too many failed attempts. Account locked for 30 minutes." };
}

// On failed login
await supabase
  .from("profiles")
  .update({ 
    failed_login_attempts: user.failed_login_attempts + 1 
  })
  .eq("id", user.id);

// On successful login
await supabase
  .from("profiles")
  .update({ 
    failed_login_attempts: 0,
    locked_until: null
  })
  .eq("id", user.id);
```

#### 3. CSRF Protection
**Status**: ❌ Not Implemented  
**Risk Level**: Medium  
**Impact**: Prevents cross-site request forgery

**Implementation**:
```typescript
// Install: npm install csrf

import { doubleCsrf } from "csrf-csrf";

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET!,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  },
});

// Add to forms
export async function getCSRFToken() {
  return generateToken();
}

// Validate on server actions
export async function protectedAction(formData: FormData) {
  const token = formData.get("csrf_token");
  // Validate token
}
```

#### 4. Stronger Password Requirements
**Status**: ⚠️ Partially Implemented  
**Risk Level**: Medium  
**Impact**: Improves password strength

**Current**: 6 characters minimum  
**Recommended**: 8-12 characters with complexity

**Implementation**:
```typescript
function validatePassword(password: string) {
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { error: "Password must contain at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { error: "Password must contain at least one lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { error: "Password must contain at least one number" };
  }
  
  // Optional: special characters
  // if (!/[!@#$%^&*]/.test(password)) {
  //   return { error: "Password must contain at least one special character" };
  // }
  
  return { success: true };
}
```

---

### Medium Priority

#### 5. Audit Logging
**Status**: ❌ Not Implemented  
**Risk Level**: Medium  
**Impact**: Security monitoring and compliance

**Implementation**:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Events to log**:
- Login success/failure
- Password changes
- OTP requests
- Account lockouts
- Session creation/destruction

#### 6. Email Verification
**Status**: ❌ Not Implemented  
**Risk Level**: Medium  
**Impact**: Prevents fake accounts

**Implementation**:
```sql
ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN email_verification_token TEXT;
ALTER TABLE profiles ADD COLUMN email_verification_expires TIMESTAMP;
```

#### 7. Two-Factor Authentication (2FA)
**Status**: ❌ Not Implemented  
**Risk Level**: Low (nice to have)  
**Impact**: Additional security layer

**Implementation**:
```typescript
// Install: npm install otpauth qrcode

import { TOTP } from "otpauth";

// Generate secret
const secret = new TOTP({
  issuer: "Haseeb",
  label: user.email,
  algorithm: "SHA1",
  digits: 6,
  period: 30,
}).secret.base32;

// Verify token
const totp = new TOTP({ secret });
const isValid = totp.validate({ token, window: 1 });
```

#### 8. Session Management
**Status**: ⚠️ Partially Implemented  
**Risk Level**: Low  
**Impact**: Better user control

**Features to add**:
- View active sessions
- Logout from all devices
- Last login timestamp
- Device/location tracking

**Implementation**:
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    token_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. Password History
**Status**: ❌ Not Implemented  
**Risk Level**: Low  
**Impact**: Prevents password reuse

**Implementation**:
```sql
CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prevent reusing last 5 passwords
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
```

---

### Low Priority

#### 10. Security Headers
**Status**: ⚠️ Partially Implemented  
**Risk Level**: Low  
**Impact**: Defense in depth

**Implementation in `next.config.mjs`**:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

#### 11. Content Security Policy (CSP)
**Status**: ❌ Not Implemented  
**Risk Level**: Low  
**Impact**: XSS protection

**Implementation**:
```typescript
// In middleware.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
`;

response.headers.set('Content-Security-Policy', cspHeader.replace(/\n/g, ''));
```

#### 12. Database Cleanup Jobs
**Status**: ❌ Not Implemented  
**Risk Level**: Low  
**Impact**: Database hygiene

**Implementation**:
```sql
-- Cron job to delete expired OTPs (run every hour)
DELETE FROM auth_otps WHERE expires_at < NOW();

-- Delete old audit logs (run daily)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🔍 Security Testing Checklist

### Authentication Tests

- [ ] **SQL Injection**
  - [ ] Test email input with SQL injection payloads
  - [ ] Test password input with SQL injection payloads
  - [ ] Test OTP code with SQL injection payloads

- [ ] **XSS (Cross-Site Scripting)**
  - [ ] Test email input with XSS payloads
  - [ ] Test error messages for XSS vulnerabilities
  - [ ] Verify httpOnly cookies prevent JS access

- [ ] **CSRF (Cross-Site Request Forgery)**
  - [ ] Test form submissions from external sites
  - [ ] Verify SameSite cookie attribute
  - [ ] Test API endpoints for CSRF protection

- [ ] **Brute Force**
  - [ ] Test rapid OTP requests
  - [ ] Test rapid password login attempts
  - [ ] Test rapid OTP verification attempts

- [ ] **Session Security**
  - [ ] Test JWT tampering
  - [ ] Test expired JWT handling
  - [ ] Test session hijacking
  - [ ] Test concurrent sessions

- [ ] **Password Security**
  - [ ] Test weak passwords
  - [ ] Test password in URL/logs
  - [ ] Test password reset flow
  - [ ] Test password change flow

- [ ] **OTP Security**
  - [ ] Test expired OTP
  - [ ] Test reused OTP
  - [ ] Test OTP for different email
  - [ ] Test OTP timing attacks

### Authorization Tests

- [ ] **Route Protection**
  - [ ] Access protected routes without session
  - [ ] Access protected routes with expired session
  - [ ] Access protected routes with tampered session

- [ ] **API Protection**
  - [ ] Call protected APIs without session
  - [ ] Call protected APIs with invalid session
  - [ ] Call protected APIs with another user's session

### Input Validation Tests

- [ ] **Email Validation**
  - [ ] Invalid email formats
  - [ ] Very long emails
  - [ ] Special characters in email
  - [ ] Unicode in email

- [ ] **Password Validation**
  - [ ] Empty password
  - [ ] Very long password (>1000 chars)
  - [ ] Unicode in password
  - [ ] Null bytes in password

- [ ] **OTP Validation**
  - [ ] Non-numeric OTP
  - [ ] Wrong length OTP
  - [ ] Negative numbers
  - [ ] Very large numbers

---

## 📊 Security Metrics

### Current Security Score: 7/10

**Breakdown**:
- ✅ Password Security: 8/10
- ✅ Session Security: 9/10
- ✅ OTP Security: 8/10
- ⚠️ Rate Limiting: 0/10
- ⚠️ Account Protection: 5/10
- ⚠️ Audit Logging: 0/10
- ✅ Route Protection: 10/10
- ⚠️ CSRF Protection: 0/10

### Target Security Score: 9/10

**To achieve**:
1. Implement rate limiting (+1.5)
2. Add account lockout (+0.5)
3. Add CSRF protection (+0.5)
4. Implement audit logging (+0.5)

---

## 🚨 Incident Response Plan

### If Breach Detected

1. **Immediate Actions**
   - [ ] Revoke all active sessions
   - [ ] Change JWT_SECRET
   - [ ] Lock affected accounts
   - [ ] Enable maintenance mode if needed

2. **Investigation**
   - [ ] Review audit logs
   - [ ] Identify attack vector
   - [ ] Assess data exposure
   - [ ] Document timeline

3. **Communication**
   - [ ] Notify affected users
   - [ ] Provide guidance (password reset)
   - [ ] Update status page

4. **Remediation**
   - [ ] Fix vulnerability
   - [ ] Deploy security patch
   - [ ] Force password resets if needed
   - [ ] Update security measures

5. **Post-Incident**
   - [ ] Conduct post-mortem
   - [ ] Update security policies
   - [ ] Implement additional monitoring
   - [ ] Train team on lessons learned

---

## 📋 Compliance Checklist

### GDPR Compliance

- [ ] **Data Minimization** - Only collect necessary data
- [ ] **Right to Access** - Users can view their data
- [ ] **Right to Deletion** - Users can delete their account
- [ ] **Data Portability** - Users can export their data
- [ ] **Consent** - Clear consent for data processing
- [ ] **Privacy Policy** - Clear privacy policy
- [ ] **Data Breach Notification** - Process for breach notification

### OWASP Top 10 (2021)

- [x] **A01: Broken Access Control** - Middleware protection
- [x] **A02: Cryptographic Failures** - bcrypt, JWT, HTTPS
- [ ] **A03: Injection** - Needs parameterized queries (Supabase handles)
- [ ] **A04: Insecure Design** - Needs rate limiting
- [x] **A05: Security Misconfiguration** - Environment variables
- [x] **A06: Vulnerable Components** - Keep dependencies updated
- [x] **A07: Authentication Failures** - Strong auth system
- [ ] **A08: Software and Data Integrity** - Needs CSP
- [ ] **A09: Security Logging Failures** - Needs audit logging
- [ ] **A10: Server-Side Request Forgery** - Not applicable

---

## 🔄 Regular Security Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check for suspicious activity
- [ ] Review failed login attempts

### Weekly
- [ ] Review audit logs
- [ ] Check for security updates
- [ ] Test backup restoration

### Monthly
- [ ] Update dependencies
- [ ] Review access controls
- [ ] Test incident response plan
- [ ] Security awareness training

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update policies
- [ ] Compliance review

### Annually
- [ ] Third-party security audit
- [ ] Disaster recovery drill
- [ ] Update incident response plan
- [ ] Review and update documentation

---

**Last Security Audit**: 2025-12-29  
**Next Scheduled Audit**: 2026-03-29  
**Security Contact**: security@haseeb.app
