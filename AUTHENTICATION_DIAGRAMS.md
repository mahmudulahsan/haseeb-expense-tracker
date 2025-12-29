# Authentication System - Visual Diagrams

This document contains ASCII diagrams to help visualize the authentication system.

## 🔄 Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HASEEB AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  User Opens  │
                              │  /login Page │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Enter Email  │
                              └──────┬───────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │ POST /api/auth/otp/send        │
                    │ { email }                      │
                    └────────────┬───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────┐
                    │ Check profiles.password_hash   │
                    └────────────┬───────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │  password_hash EXISTS │       │  password_hash NULL   │
    └───────────┬───────────┘       └───────────┬───────────┘
                │                                 │
                ▼                                 ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │ Return                │       │ Generate 6-digit OTP  │
    │ passwordRequired:true │       │ Store in auth_otps    │
    └───────────┬───────────┘       │ Send via Resend       │
                │                   └───────────┬───────────┘
                │                               │
                ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │ Show Password Input   │       │ Show OTP Input        │
    └───────────┬───────────┘       └───────────┬───────────┘
                │                               │
                ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │ User Enters Password  │       │ User Enters OTP       │
    └───────────┬───────────┘       └───────────┬───────────┘
                │                               │
                ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │ Server Action:        │       │ POST                  │
    │ loginWithPassword()   │       │ /api/auth/otp/verify  │
    └───────────┬───────────┘       └───────────┬───────────┘
                │                               │
                ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │ bcrypt.compare()      │       │ Verify OTP code       │
    │ password vs hash      │       │ Check expiration      │
    └───────────┬───────────┘       └───────────┬───────────┘
                │                               │
                │                               ▼
                │                   ┌───────────────────────┐
                │                   │ Get/Create User       │
                │                   │ in profiles table     │
                │                   └───────────┬───────────┘
                │                               │
                │                               ▼
                │                   ┌───────────────────────┐
                │                   │ password_hash NULL?   │
                │                   └───────────┬───────────┘
                │                               │
                │                   ┌───────────┴───────────┐
                │                   │                       │
                │                   ▼                       ▼
                │       ┌───────────────────┐   ┌───────────────────┐
                │       │ Return            │   │ Continue to       │
                │       │ needsPassword:true│   │ Create Session    │
                │       └─────────┬─────────┘   └─────────┬─────────┘
                │                 │                       │
                │                 ▼                       │
                │       ┌───────────────────┐             │
                │       │ Show Set Password │             │
                │       │ Screen            │             │
                │       └─────────┬─────────┘             │
                │                 │                       │
                │                 ▼                       │
                │       ┌───────────────────┐             │
                │       │ User Sets Password│             │
                │       └─────────┬─────────┘             │
                │                 │                       │
                │                 ▼                       │
                │       ┌───────────────────┐             │
                │       │ Server Action:    │             │
                │       │ setPassword()     │             │
                │       └─────────┬─────────┘             │
                │                 │                       │
                └─────────────────┴───────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │ Create JWT Session  │
                        │ lib/auth.ts:login() │
                        └─────────┬───────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │ Set httpOnly Cookie │
                        │ name: "session"     │
                        │ expires: 7 days     │
                        └─────────┬───────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │ Redirect to         │
                        │ /dashboard          │
                        └─────────────────────┘
```

---

## 🔐 JWT Session Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          JWT SESSION LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │ User Authenticates  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ lib/auth.ts:login()                     │
    │                                         │
    │ 1. Create payload:                      │
    │    { user: { id, email }, expires }     │
    │                                         │
    │ 2. Sign with JWT (HS256):               │
    │    - Algorithm: HS256                   │
    │    - Secret: JWT_SECRET                 │
    │    - Expiration: 7 days                 │
    │                                         │
    │ 3. Set httpOnly cookie:                 │
    │    - Name: "session"                    │
    │    - Value: JWT token                   │
    │    - HttpOnly: true                     │
    │    - Expires: 7 days                    │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ User Makes Request  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ middleware.ts                           │
    │                                         │
    │ 1. Get session cookie                   │
    │ 2. Call getSession()                    │
    │ 3. Decrypt & verify JWT                 │
    │ 4. Check expiration                     │
    │                                         │
    │ If valid:                               │
    │   - Update session (refresh)            │
    │   - Allow request                       │
    │                                         │
    │ If invalid:                             │
    │   - Redirect to /login                  │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Session Active      │
    │ (7 days or logout)  │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ User Logs Out       │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ POST /auth/signout                      │
    │                                         │
    │ 1. Call logout()                        │
    │ 2. Clear session cookie                 │
    │    (set expires to past date)           │
    │ 3. Redirect to /login                   │
    └─────────────────────────────────────────┘
```

---

## 📧 OTP Email Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OTP GENERATION & DELIVERY                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │ User Requests OTP   │
    │ (enters email)      │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ POST /api/auth/otp/send                 │
    │                                         │
    │ 1. Validate email format                │
    │ 2. Check if user has password           │
    │    (query profiles table)               │
    │                                         │
    │ If has password & !allowForgot:         │
    │   → Return passwordRequired: true       │
    │                                         │
    │ Otherwise:                              │
    │   → Continue to generate OTP            │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ Generate OTP                            │
    │                                         │
    │ code = Math.floor(                      │
    │   100000 + Math.random() * 900000       │
    │ ).toString()                            │
    │                                         │
    │ Result: 6-digit code (e.g., "123456")   │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ Store in Database                       │
    │                                         │
    │ 1. Delete old OTPs for this email       │
    │    DELETE FROM auth_otps                │
    │    WHERE email = ?                      │
    │                                         │
    │ 2. Insert new OTP                       │
    │    INSERT INTO auth_otps                │
    │    (email, code, expires_at)            │
    │    VALUES (?, ?, NOW() + 10 min)        │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ Send Email via Resend                   │
    │                                         │
    │ From: Haseeb <onboarding@resend.dev>    │
    │ To: user@example.com                    │
    │ Subject: Your Login Code - Haseeb       │
    │                                         │
    │ ┌─────────────────────────────────────┐ │
    │ │  🐷 Welcome to Haseeb               │ │
    │ │                                     │ │
    │ │  Your OTP:                          │ │
    │ │  ┌─────────────┐                    │ │
    │ │  │   123456    │                    │ │
    │ │  └─────────────┘                    │ │
    │ │                                     │ │
    │ │  Expires in 10 minutes              │ │
    │ └─────────────────────────────────────┘ │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ User Receives Email │
    │ (within seconds)    │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ User Enters OTP     │
    │ on Login Page       │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ POST /api/auth/otp/verify               │
    │                                         │
    │ 1. Query auth_otps table                │
    │    WHERE email = ? AND code = ?         │
    │                                         │
    │ 2. Check if found                       │
    │    If not: Return "Invalid code"        │
    │                                         │
    │ 3. Check expiration                     │
    │    If expired: Return "Code expired"    │
    │                                         │
    │ 4. Get/Create user in profiles          │
    │                                         │
    │ 5. Delete used OTP                      │
    │    DELETE FROM auth_otps                │
    │    WHERE email = ?                      │
    │                                         │
    │ 6. Check if password needed             │
    │    If !password_hash OR isForgot:       │
    │      → Return needsPassword: true       │
    │    Else:                                │
    │      → Create session & login           │
    └─────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE STRUCTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            profiles                      │
├──────────────────────────────────────────┤
│ id              UUID (PK)                │
│ email           TEXT (UNIQUE, NOT NULL)  │
│ password_hash   TEXT (NULLABLE)          │
│ created_at      TIMESTAMP                │
│ updated_at      TIMESTAMP                │
└──────────────────────────────────────────┘
         │
         │ 1:N (one user can have multiple transactions)
         │
         ▼
┌──────────────────────────────────────────┐
│         transactions                     │
│         (other tables...)                │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│           auth_otps                      │
├──────────────────────────────────────────┤
│ id              UUID (PK)                │
│ email           TEXT (NOT NULL)          │
│ code            TEXT (NOT NULL)          │
│ expires_at      TIMESTAMP (NOT NULL)     │
│ created_at      TIMESTAMP                │
├──────────────────────────────────────────┤
│ Indexes:                                 │
│ - idx_auth_otps_email                    │
│ - idx_auth_otps_expires_at               │
└──────────────────────────────────────────┘

Notes:
- profiles.password_hash is NULL for OTP-only users
- auth_otps has no foreign key (allows OTP before user creation)
- Old OTPs are deleted when new one is requested
- Expired OTPs should be cleaned up periodically
```

---

## 🛡️ Middleware Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MIDDLEWARE PROTECTION                              │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │ User Makes       │
                        │ Request          │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ middleware.ts    │
                        │ Intercepts       │
                        └────────┬─────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Get session cookie     │
                    │ Call getSession()      │
                    └────────┬───────────────┘
                             │
                             ▼
                ┌────────────────────────────┐
                │ Check if public path       │
                │ /login                     │
                │ /api/auth/otp/send         │
                │ /api/auth/otp/verify       │
                └────────┬───────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐               ┌───────────────┐
│ Public Path   │               │ Protected Path│
└───────┬───────┘               └───────┬───────┘
        │                               │
        ▼                               ▼
┌───────────────┐               ┌───────────────┐
│ Has Session?  │               │ Has Session?  │
└───────┬───────┘               └───────┬───────┘
        │                               │
   ┌────┴────┐                     ┌────┴────┐
   │         │                     │         │
   ▼         ▼                     ▼         ▼
┌─────┐  ┌─────┐              ┌─────┐  ┌─────┐
│ YES │  │ NO  │              │ YES │  │ NO  │
└──┬──┘  └──┬──┘              └──┬──┘  └──┬──┘
   │        │                    │        │
   │        │                    │        │
   │        ▼                    │        ▼
   │   ┌─────────┐               │   ┌──────────┐
   │   │ Allow   │               │   │ Redirect │
   │   │ Access  │               │   │ to       │
   │   └─────────┘               │   │ /login   │
   │                             │   └──────────┘
   ▼                             │
┌──────────┐                     │
│ Is /login│                     │
│ path?    │                     │
└────┬─────┘                     │
     │                           │
  ┌──┴──┐                        │
  │     │                        │
  ▼     ▼                        ▼
┌────┐ ┌────┐              ┌──────────┐
│YES │ │NO  │              │ Update   │
└─┬──┘ └─┬──┘              │ Session  │
  │      │                 │ (refresh)│
  │      │                 └────┬─────┘
  │      │                      │
  ▼      ▼                      ▼
┌────────────┐            ┌──────────┐
│ Redirect   │            │ Allow    │
│ to         │            │ Access   │
│ /dashboard │            └──────────┘
└────────────┘
```

---

## 🔄 Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FORGOT PASSWORD FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │ User on Password    │
    │ Login Screen        │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Clicks "Forgot      │
    │ Password?"          │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ POST /api/auth/otp/send                 │
    │ { email, allowForgot: true }            │
    │                                         │
    │ Note: allowForgot bypasses password     │
    │ check, always sends OTP                 │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ OTP Sent to Email   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ User Enters OTP     │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ POST /api/auth/otp/verify               │
    │ { email, code, isForgot: true }         │
    │                                         │
    │ Note: isForgot forces password reset    │
    │ screen even if password exists          │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ Return needsPassword: true              │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Show Set Password   │
    │ Screen              │
    │ (labeled "Reset")   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ User Enters New     │
    │ Password (2x)       │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │ Server Action: setPassword()            │
    │                                         │
    │ 1. Validate password                    │
    │ 2. Hash with bcrypt                     │
    │ 3. Update profiles.password_hash        │
    │ 4. Create session                       │
    │ 5. Login user                           │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Redirect to         │
    │ /dashboard          │
    └─────────────────────┘
```

---

## 📊 Component Interaction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT SIDE                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │  app/(auth)/login/page.tsx                                       │     │
│  │  (Client Component)                                              │     │
│  │                                                                  │     │
│  │  - Email input                                                   │     │
│  │  - OTP input                                                     │     │
│  │  - Password input                                                │     │
│  │  - Set password form                                             │     │
│  │  - State management (step, email, otp, password)                │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ fetch() / Server Actions
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              SERVER SIDE                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────┐         ┌──────────────────────┐                │
│  │  API Routes          │         │  Server Actions      │                │
│  ├──────────────────────┤         ├──────────────────────┤                │
│  │                      │         │                      │                │
│  │  /api/auth/otp/send  │         │  setPassword()       │                │
│  │  /api/auth/otp/verify│         │  loginWithPassword() │                │
│  │  /auth/signout       │         │  changePassword()    │                │
│  │                      │         │                      │                │
│  └──────────┬───────────┘         └──────────┬───────────┘                │
│             │                                │                            │
│             └────────────┬───────────────────┘                            │
│                          │                                                │
│                          ▼                                                │
│              ┌────────────────────────┐                                   │
│              │  lib/auth.ts           │                                   │
│              ├────────────────────────┤                                   │
│              │  - encrypt()           │                                   │
│              │  - decrypt()           │                                   │
│              │  - login()             │                                   │
│              │  - logout()            │                                   │
│              │  - getSession()        │                                   │
│              │  - updateSession()     │                                   │
│              └────────────┬───────────┘                                   │
│                           │                                               │
│              ┌────────────┴───────────┐                                   │
│              │                        │                                   │
│              ▼                        ▼                                   │
│  ┌────────────────────┐   ┌────────────────────┐                         │
│  │  lib/supabase/     │   │  lib/resend.ts     │                         │
│  ├────────────────────┤   ├────────────────────┤                         │
│  │  - admin.ts        │   │  - Resend client   │                         │
│  │  - server.ts       │   │  - Email sending   │                         │
│  │  - client.ts       │   └────────────────────┘                         │
│  └────────────────────┘                                                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────┐         ┌──────────────────────┐                │
│  │  Supabase            │         │  Resend              │                │
│  ├──────────────────────┤         ├──────────────────────┤                │
│  │  - profiles table    │         │  - Email delivery    │                │
│  │  - auth_otps table   │         │  - OTP emails        │                │
│  │  - PostgreSQL DB     │         └──────────────────────┘                │
│  └──────────────────────┘                                                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

**Visual Diagrams Version**: 1.0  
**Last Updated**: 2025-12-29
