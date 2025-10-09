# MVP Authentication System

🚀 A production-ready authentication system built with **Next.js 15**, **Firebase Auth**, and **TypeScript**.

## ✨ Features

- 🔐 **Multi-Provider Authentication**: Email/Password, GitHub OAuth
- ⏰ **Token Expiration Management**: 7-day token expiration with automatic refresh
- 🔔 **Expiration Warnings**: Proactive notifications before session expires
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
3. **Token Management**: 7-day expiration with automatic refresh
4. **Session Monitoring**: Real-time expiration warnings
5. **Protected Routes**: Automatic redirects for unauthenticated users
6. **Profile Management**: Update username and profile photo
7. **Sign Out**: Clear session and redirect

### ⏰ Token Expiration System

- **Firebase Tokens**: 7-day expiration with automatic refresh
- **GitHub OAuth**: 7-day authorization expiration
- **Proactive Warnings**: Notifications 1 hour before expiration
- **Automatic Refresh**: Seamless token renewal when possible
- **Graceful Expiration**: Automatic logout when tokens expire
- **Session Recovery**: Clear messaging and easy re-authentication

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
- ✅ **7-day token expiration with automatic cleanup**
- ✅ **Session monitoring and proactive warnings**
- ✅ **Automatic token refresh before expiration**
- ✅ **Secure token storage and management**

## ⏰ Token Expiration System

The MVP Auth system includes a comprehensive token expiration management system designed to enhance security while maintaining a smooth user experience.

### Features

- **7-Day Token Expiration**: Both Firebase and GitHub OAuth tokens expire after 7 days
- **Proactive Warnings**: Users receive notifications 1 hour before token expiration
- **Automatic Refresh**: Firebase tokens are automatically refreshed when possible
- **Session Monitoring**: Real-time monitoring of token status across the application
- **Graceful Handling**: Automatic logout and clear messaging when tokens expire
- **Visual Indicators**: Token status dashboard showing expiration times and health

### Components

#### TokenExpirationWarning
A floating notification that appears when tokens are about to expire:
- Shows time remaining until expiration
- Provides "Extend Session" button for token refresh
- Can be dismissed temporarily
- Urgent styling for tokens expiring within 15 minutes

#### TokenStatus
A comprehensive dashboard showing detailed token information:
- Firebase session status and expiration time
- GitHub authorization status and expiration time  
- Manual refresh buttons
- Real-time countdown to expiration
- Visual health indicators

#### useTokenManager Hook
A React hook providing:
```typescript
const {
  tokenStatus,        // Detailed status of all tokens
  isAnyTokenExpired,  // Boolean indicating if any token is expired
  refreshTokens,      // Function to refresh tokens
  forceRefresh,       // Function to force token refresh
  loading,           // Loading state
  lastChecked        // Last check timestamp
} = useTokenManager();
```

### Implementation Details

- **Storage**: Tokens are stored in localStorage with expiration metadata
- **Monitoring**: Automatic checks every 30 minutes and on page visibility changes
- **Cleanup**: Expired tokens are automatically removed from storage
- **Security**: Tokens are cleared on logout and browser close
- **Recovery**: Clear messaging and easy re-authentication flow

### Configuration

Token expiration settings can be modified in `src/app/lib/tokenManager.ts`:

```typescript
// Token expiration duration: 7 days in milliseconds
export const TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

// Show warnings 1 day before expiration
export const REFRESH_THRESHOLD = 24 * 60 * 60 * 1000;
```

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
