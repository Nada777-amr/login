import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// User profile interface
export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  provider: string;
  createdAt: Date;
  emailVerified: boolean;
  photoURL?: string;
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: username,
    });

    // Send email verification
    await sendEmailVerification(user);

    // Save user profile to Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      username,
      email: user.email!,
      provider: 'email',
      createdAt: new Date(),
      emailVerified: user.emailVerified,
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return { success: true, user };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Sign in with GitHub
export const signInWithGitHub = async () => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user profile for new GitHub user
      const userProfile: UserProfile = {
        uid: user.uid,
        username: user.displayName || user.email!.split('@')[0],
        email: user.email!,
        provider: 'github',
        createdAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
    }

    return { success: true, user };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user profile for new Google user
      const userProfile: UserProfile = {
        uid: user.uid,
        username: user.displayName || user.email!.split('@')[0],
        email: user.email!,
        provider: 'google',
        createdAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
    }

    return { success: true, user };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};
