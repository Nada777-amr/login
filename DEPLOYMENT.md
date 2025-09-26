# Deployment Guide

## Vercel Deployment Instructions

### Prerequisites

1. GitHub account
2. Vercel account
3. Firebase project with Authentication enabled

### Environment Variables Setup

Before deploying to Vercel, you need to set up environment variables:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Setup for Production

1. **Update Firebase Auth Settings:**

   - Add your Vercel domain to authorized domains
   - Configure OAuth providers (GitHub, Google)
   - Set up Firestore rules

2. **Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### GitHub OAuth Configuration

1. Go to GitHub Developer Settings
2. Update OAuth App settings:
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app`

### Deploy to Vercel

1. **Connect GitHub Repository:**

   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Post-Deployment Checklist

- [ ] Test authentication flows
- [ ] Verify environment variables
- [ ] Check Firebase configuration
- [ ] Test OAuth providers
- [ ] Monitor application logs
- [ ] Set up domain (if custom)

### Troubleshooting

**Common Issues:**

1. **Firebase errors:** Check environment variables
2. **OAuth failures:** Verify redirect URLs
3. **Build failures:** Run `npm run build` locally first
4. **Type errors:** Run `npm run type-check`

### Performance Monitoring

Consider adding:

- Vercel Analytics
- Firebase Analytics
- Error tracking (Sentry)
- Performance monitoring
