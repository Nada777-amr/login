# MVP Authentication System

🚀 A production-ready authentication system built with **Next.js 15**, **Firebase Auth**, and **TypeScript**.

## ✨ Features

- 🔐 **Multi-Provider Authentication**: Email/Password, GitHub OAuth
- 🛡️ **Secure by Design**: Environment variables, security headers, error boundaries
- 🎨 **Modern UI**: Tailwind CSS with responsive design
- ⚡ **Performance**: Next.js 15 with App Router and optimizations
- 🔄 **Real-time State**: Firebase Auth state management
- 📱 **Mobile Ready**: Responsive design across all devices
- 🚀 **Production Ready**: Vercel deployment configuration

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel
- **State Management**: React Context + Firebase

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd mvp-auth
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

### 3. Development

```bash
npm run dev
# Open http://localhost:3000
```

## 🔧 Configuration

### Firebase Setup

1. Create Firebase project
2. Enable Authentication (Email, GitHub)
3. Create Firestore database
4. Copy config to `.env.local`

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/         # Reusable components
│   ├── contexts/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & configurations
│   ├── (auth routes)/    # Authentication pages
│   └── layout.tsx        # Root layout
├── middleware.ts         # Next.js middleware
└── types/               # TypeScript definitions
```

## 🔐 Authentication Flow

1. **Sign Up**: Email/password with email verification
2. **Sign In**: Email/password or GitHub OAuth
3. **Protected Routes**: Automatic redirects for unauthenticated users
4. **Profile Management**: Update username and profile photo
5. **Sign Out**: Clear session and redirect

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy!

## 🛡️ Security Features

- ✅ Environment variables for sensitive data
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Error boundaries for graceful failures
- ✅ Input validation and sanitization
- ✅ Secure Firebase rules
- ✅ OAuth provider verification

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.
