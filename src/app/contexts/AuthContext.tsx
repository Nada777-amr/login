'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
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

  async function createOrUpdateUserDoc(user: User) {
  if (!user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const role = snap.exists() ? (snap.data()?.role || "user") : "user";

  const baseData = {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email || "",
    provider: user.providerData?.[0]?.providerId || "",
    role,
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(userRef, { ...baseData, createdAt: serverTimestamp() });
    console.log("New user document created for:", user.email);
  } else {
    await setDoc(userRef, baseData, { merge: true });
    console.log("User document updated for:", user.email);
  }
}


 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
    setUser(user);

    if (user) {
      // 🔹 Create/update Firestore user document
      await createOrUpdateUserDoc(user);

      console.log('Getting user profile for:', user.uid);
      const profile = await getUserProfile(user.uid);
      console.log('User profile:', profile);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

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

  useEffect(() => {
    // Initialize token monitoring
    initializeTokenMonitoring();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      
      if (user) {
        console.log('Getting user profile for:', user.uid);
        // Get user profile from Firestore
        const profile = await getUserProfile(user.uid);
        console.log('User profile:', profile);
        
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
        
        // Set up periodic token refresh check
        const tokenCheckInterval = setInterval(async () => {
          const tokens = getStoredTokens();
          if (tokens?.firebase && shouldRefreshToken(tokens.firebase)) {
            await refreshTokens();
          }
          
          const expiration = await checkTokenExpiration();
          setTokenExpired(expiration.expired);
        }, 5 * 60 * 1000); // Check every 5 minutes
        
        // Clear interval when user changes
        return () => clearInterval(tokenCheckInterval);
      } else {
        setUserProfile(null);
        setTokenData(null);
        setTokenExpired(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
