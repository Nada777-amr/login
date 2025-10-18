'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { getUserProfile, UserProfile } from '@/app/lib/auth';
import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
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


  const value = {
    user,
    userProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
