'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  fetchSignInMethodsForEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// User profile interface
export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  provider: string;
  createdAt: Date;
  emailVerified: boolean;
  photoURL?: string;
  role?: "user" | "admin";
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: username,
    });

    await sendEmailVerification(user);

    // 👇 Default role set to "user"
    const userProfile: UserProfile = {
      uid: user.uid,
      username,
      email: user.email!,
      provider: "email",
      createdAt: new Date(),
      emailVerified: user.emailVerified,
      role: "user",
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return { success: true, user };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Sign in with GitHub
export const signInWithGitHub = async () => {
  try {
    const provider = new GithubAuthProvider();
    provider.addScope("user:email");
    provider.addScope("read:user");

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const userProfile: UserProfile = {
        uid: user.uid,
        username: user.displayName || user.email!.split("@")[0],
        email: user.email!,
        provider: "github",
        createdAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
        role: "user", // default role
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
    }

    return { success: true, user };
  } catch (error: unknown) {
    console.error("GitHub sign-in error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const userProfile: UserProfile = {
        uid: user.uid,
        username: user.displayName || user.email!.split("@")[0],
        email: user.email!,
        provider: "google",
        createdAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
        role: "user", //  default role
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
    }

    return { success: true, user };
  } catch (error: unknown) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Update user profile username and/or photo
export interface UpdateUserProfileInput {
  username?: string;
  photoFile?: File | Blob;
}

export const updateUserProfileData = async (
  uid: string,
  input: UpdateUserProfileInput
): Promise<{ success: boolean; error?: string; photoURL?: string }> => {
  try {
    const updates: Partial<UserProfile> = {};
    let newPhotoURL: string | undefined;

    if (input.photoFile) {
      const photoRef = ref(storage, `profilePhotos/${uid}`);
      await uploadBytes(photoRef, input.photoFile);
      newPhotoURL = await getDownloadURL(photoRef);
      updates.photoURL = newPhotoURL;
    }

    if (
      typeof input.username === "string" &&
      input.username.trim().length > 0
    ) {
      updates.username = input.username.trim();
    }

    if (Object.keys(updates).length > 0) {
      const userDocRef = doc(db, "users", uid);
      const existing = await getDoc(userDocRef);
      if (existing.exists()) {
        await setDoc(
          userDocRef,
          { ...existing.data(), ...updates },
          { merge: true }
        );
      }

      if (auth.currentUser && auth.currentUser.uid === uid) {
        await updateProfile(auth.currentUser, {
          displayName: updates.username,
          photoURL: newPhotoURL,
        });
      }
    }

    return { success: true, photoURL: newPhotoURL };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
};
