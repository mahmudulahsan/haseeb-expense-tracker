# Haseeb - Premium Expense Tracker

A modern, full-stack expense tracking web application built with Next.js, Supabase, and custom authentication.

## 📚 Documentation

### Authentication System
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Complete authentication system documentation
  - Architecture overview
  - Authentication flows (OTP, Password, Forgot Password)
  - Technical implementation details
  - Database schema
  - Security features
  - API endpoints
  - Best practices and recommendations

- **[AUTHENTICATION_QUICK_REFERENCE.md](./AUTHENTICATION_QUICK_REFERENCE.md)** - Quick reference guide
  - API reference
  - Code snippets
  - Common patterns
  - Debugging tips
  - Troubleshooting guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account
- Resend account (for email)
- Infisical CLI (for environment variables)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd haseeb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Infisical**
   ```bash
   # Install Infisical CLI
   # Visit: https://infisical.com/docs/cli/overview
   
   # Login to Infisical
   infisical login
   
   # Initialize project
   infisical init
   ```

4. **Configure environment variables**
   
   See `.env.example` for required variables:
   - Supabase credentials
   - Resend API key
   - JWT secret
   - Site URL

5. **Set up database**
   
   Create the following tables in Supabase:
   
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
   
   -- Indexes
   CREATE INDEX idx_auth_otps_email ON auth_otps(email);
   CREATE INDEX idx_auth_otps_expires_at ON auth_otps(expires_at);
   ```

6. **Run development server**
   ```bash
   # With Infisical
   npm run dev:inf
   
   # Or without Infisical (using .env.local)
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **Next.js API Routes** - API endpoints
- **Server Actions** - Server-side mutations
- **Supabase** - Database (PostgreSQL)
- **Resend** - Email service

### Authentication
- **Custom JWT** - Session management
- **bcrypt** - Password hashing
- **OTP** - Email verification
- **jose** - JWT signing/verification

### Development
- **Infisical** - Secret management
- **ESLint** - Code linting
- **TypeScript** - Type checking

## 📁 Project Structure

```
haseeb/
├── app/
│   ├── (auth)/
│   │   └── login/          # Login page
│   ├── (dashboard)/        # Protected dashboard routes
│   ├── actions/
│   │   ├── auth.ts         # Authentication server actions
│   │   └── finance.ts      # Finance server actions
│   ├── api/
│   │   └── auth/
│   │       └── otp/        # OTP API endpoints
│   ├── auth/
│   │   └── signout/        # Logout endpoint
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.ts             # JWT session management
│   ├── resend.ts           # Email service
│   ├── supabase/
│   │   ├── admin.ts        # Admin Supabase client
│   │   ├── server.ts       # Server Supabase client
│   │   ├── client.ts       # Browser Supabase client
│   │   └── middleware.ts   # Middleware Supabase client
│   └── validations/        # Validation schemas
├── services/               # Business logic services
├── types/                  # TypeScript type definitions
├── middleware.ts           # Route protection middleware
├── AUTHENTICATION.md       # Auth documentation
└── AUTHENTICATION_QUICK_REFERENCE.md  # Quick reference
```

## 🔐 Authentication Features

- **OTP Email Verification** - Passwordless login with 6-digit codes
- **Password Authentication** - Traditional email/password login
- **Forgot Password** - Password reset via OTP
- **JWT Sessions** - Secure, httpOnly cookie-based sessions
- **Route Protection** - Middleware-based authentication
- **Session Refresh** - Automatic session extension on activity

## 🛡️ Security

- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT with HS256 algorithm
- ✅ httpOnly cookies (prevents XSS)
- ✅ 7-day session expiration
- ✅ 10-minute OTP expiration
- ✅ Single-use OTPs
- ✅ Server-side validation
- ✅ Middleware route protection

## 📝 Available Scripts

```bash
# Development with Infisical
npm run dev:inf

# Development without Infisical
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file or use Infisical:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_your_api_key

# Authentication
JWT_SECRET=your-random-secret-key-min-32-chars

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate JWT secret:
```bash
openssl rand -base64 32
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] New user registration with OTP
- [ ] Existing user login with password
- [ ] Forgot password flow
- [ ] Change password (authenticated)
- [ ] Logout functionality
- [ ] Session expiration
- [ ] Invalid OTP handling
- [ ] Wrong password handling
- [ ] Middleware redirects

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Haseeb Development Team

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Resend for email delivery
- shadcn for the beautiful UI components

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-29
