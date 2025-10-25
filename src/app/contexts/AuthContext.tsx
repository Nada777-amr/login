'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/app/lib/firebase';
import { getUserProfile, UserProfile } from '@/app/lib/auth';


import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { 
  initializeTokenMonitoring, 
  checkTokenExpiration, 
  getStoredTokens, 
  isTokenExpired,
  refreshFirebaseToken,
  shouldRefreshToken,
  type StoredTokenData 
} from '@/app/lib/tokenManager';


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  tokenData: StoredTokenData | null;
  tokenExpired: boolean;
  refreshTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  tokenData: null,
  tokenExpired: false,
  refreshTokens: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [tokenData, setTokenData] = useState<StoredTokenData | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  // Function to refresh tokens
  const refreshTokens = async () => {
    try {
      await refreshFirebaseToken();
      const updated = getStoredTokens();
      setTokenData(updated);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    }
  };

  // Helper function to create or update user document - ONLY updates, does NOT create new users
  // User creation is handled in signup/login flows to prevent duplicates
  async function updateUserDocIfNeeded(user: User) {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // Only update if document already exists - don't create new users here
    if (snap.exists()) {
      const baseData = {
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, baseData, { merge: true });
      console.log("User document updated for:", user.email);
    }
  }

  useEffect(() => {
    // Initialize token monitoring
    initializeTokenMonitoring();
    
    let isSubscribed = true;
    let processingAuth = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Prevent race conditions by ensuring we process auth changes sequentially
      if (processingAuth) {
        console.log('Auth state change ignored - already processing');
        return;
      }
      
      processingAuth = true;
      console.log('Auth state changed:', user ? `User: ${user.email}, Verified: ${user.emailVerified}` : 'No user');
      
      if (!isSubscribed) {
        processingAuth = false;
        return;
      }
      
      setUser(user);
      
      if (user) {
        // CRITICAL: Check email verification for email/password users
        // This prevents race conditions when signOut hasn't completed yet
        if (user.providerData[0]?.providerId === 'password' && !user.emailVerified) {
          console.log('⚠️ Email/password user not verified in AuthContext - signing out');
          setUser(null);
          setUserProfile(null);
          setTokenData(null);
          setTokenExpired(false);
          setLoading(false);
          processingAuth = false;
          // Force sign out if not already signed out
          if (auth.currentUser) {
            await signOut(auth);
          }
          return;
        }
        
        console.log('Getting user profile for:', user.uid);
        
        try {
          // Get user profile from Firestore
          const profile = await getUserProfile(user.uid);
          console.log('User profile:', profile);
          
          if (!isSubscribed) {
            processingAuth = false;
            return;
          }
          
          // Update profile if email verification status changed
          if (profile && profile.emailVerified !== user.emailVerified) {
            console.log('Updating email verification status in profile');
            const updatedProfile = { ...profile, emailVerified: user.emailVerified };
            try {
              await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
              setUserProfile(updatedProfile);
            } catch (error) {
              console.error('Error updating profile verification status:', error);
              setUserProfile(profile);
            }
          } else {
            setUserProfile(profile);
          }
          
          // Check token expiration
          const expiration = await checkTokenExpiration();
          setTokenExpired(expiration.expired);
          
          // Get current token data
          const tokens = getStoredTokens();
          setTokenData(tokens);
          
          // Set loading to false BEFORE setting up interval
          setLoading(false);
          processingAuth = false;
          
          // Set up periodic token refresh check
          const tokenCheckInterval = setInterval(async () => {
            const tokens = getStoredTokens();
            if (tokens?.firebase && shouldRefreshToken(tokens.firebase)) {
              await refreshTokens();
            }
            
            const expiration = await checkTokenExpiration();
            setTokenExpired(expiration.expired);
          }, 5 * 60 * 1000); // Check every 5 minutes
          
          // Return cleanup function
          return () => {
            clearInterval(tokenCheckInterval);
          };
        } catch (error) {
          console.error('Error processing authenticated user:', error);
          setLoading(false);
          processingAuth = false;
        }
      } else {
        setUserProfile(null);
        setTokenData(null);
        setTokenExpired(false);
        setLoading(false);
        processingAuth = false;
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);



  const value = {
    user,
    userProfile,
    loading,
    tokenData,
    tokenExpired,
    refreshTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
