'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';
import { getUserProfile, UserProfile } from '@/app/lib/auth';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
