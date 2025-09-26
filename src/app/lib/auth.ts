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
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
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
      provider: "email",
      createdAt: new Date(),
      emailVerified: user.emailVerified,
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
    console.log("Creating GitHub provider...");
    const provider = new GithubAuthProvider();

    // Add scopes for better GitHub integration
    provider.addScope("user:email");
    provider.addScope("read:user");

    console.log("Provider created, attempting popup...");

    const userCredential = await signInWithPopup(auth, provider);
    console.log("Popup successful, user:", userCredential.user);
    const user = userCredential.user;

    // Check if user profile exists in Firestore
    console.log("Checking if user profile exists for UID:", user.uid);
    const userDoc = await getDoc(doc(db, "users", user.uid));
    console.log("User document exists:", userDoc.exists());

    if (!userDoc.exists()) {
      console.log("Creating new user profile...");
      // Create user profile for new GitHub user
      const userProfile: UserProfile = {
        uid: user.uid,
        username: user.displayName || user.email!.split("@")[0],
        email: user.email!,
        provider: "github",
        createdAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      };

      console.log("Saving user profile:", userProfile);
      await setDoc(doc(db, "users", user.uid), userProfile);
      console.log("User profile created successfully");
    } else {
      console.log("User profile already exists");
    }

    console.log("GitHub login completed successfully");
    return { success: true, user };
  } catch (error: unknown) {
    console.error("GitHub auth error:", error);

    // Handle specific Firebase auth errors
    if (typeof error === "object" && error !== null) {
      const firebaseError = error as {
        code?: string;
        customData?: { email?: string };
      };
      const code: string | undefined = firebaseError.code;
      // If user already has an account with the same email but different provider
      if (code === "auth/account-exists-with-different-credential") {
        try {
          const email: string | undefined = firebaseError.customData?.email;
          let methodHint = "";
          if (email) {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods && methods.length > 0) {
              const primary = methods[0];
              // Map Firebase method IDs to readable provider names
              const providerMap: Record<string, string> = {
                password: "Email and password",
                "google.com": "Google",
                "github.com": "GitHub",
                "facebook.com": "Facebook",
                "twitter.com": "Twitter",
                "apple.com": "Apple",
              };
              methodHint = providerMap[primary] || primary;
            }
          }
          const msgBase =
            "An account already exists with the same email but using a different sign-in method.";
          const msgHint = methodHint
            ? ` Please sign in with ${methodHint}${
                email ? ` (${email})` : ""
              } first, then link GitHub from your account settings.`
            : " Please sign in with your original method first, then link GitHub from your account settings.";
          return { success: false, error: msgBase + msgHint };
        } catch {
          return {
            success: false,
            error:
              "An account exists with this email using a different method. Please sign in with your original method first, then link GitHub from your account settings.",
          };
        }
      }
    }

    if (error instanceof Error) {
      if (error.message.includes("popup-closed-by-user")) {
        return {
          success: false,
          error: "Sign-in was cancelled. Please try again.",
        };
      } else if (error.message.includes("auth/popup-blocked")) {
        return {
          success: false,
          error:
            "Popup was blocked by your browser. Please allow popups for this site.",
        };
      } else if (error.message.includes("auth/cancelled-popup-request")) {
        return {
          success: false,
          error: "Sign-in was cancelled. Please try again.",
        };
      }
    }

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

    // Check if user profile exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // Create user profile for new Google user
      const userProfile: UserProfile = {
        uid: user.uid,
        username: user.displayName || user.email!.split("@")[0],
        email: user.email!,
        provider: "google",
        createdAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
    }

    return { success: true, user };
  } catch (error: unknown) {
    // Handle account-exists-with-different-credential similarly for Google
    if (typeof error === "object" && error !== null) {
      const firebaseError = error as {
        code?: string;
        customData?: { email?: string };
      };
      const code: string | undefined = firebaseError.code;
      if (code === "auth/account-exists-with-different-credential") {
        try {
          const email: string | undefined = firebaseError.customData?.email;
          let methodHint = "";
          if (email) {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods && methods.length > 0) {
              const primary = methods[0];
              const providerMap: Record<string, string> = {
                password: "Email and password",
                "google.com": "Google",
                "github.com": "GitHub",
                "facebook.com": "Facebook",
                "twitter.com": "Twitter",
                "apple.com": "Apple",
              };
              methodHint = providerMap[primary] || primary;
            }
          }
          const msgBase =
            "An account already exists with the same email but using a different sign-in method.";
          const msgHint = methodHint
            ? ` Please sign in with ${methodHint}${
                email ? ` (${email})` : ""
              } first, then link Google from your account settings.`
            : " Please sign in with your original method first, then link Google from your account settings.";
          return { success: false, error: msgBase + msgHint };
        } catch {
          return {
            success: false,
            error:
              "An account exists with this email using a different method. Please sign in with your original method first, then link Google from your account settings.",
          };
        }
      }
    }

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
      // Update Firestore doc
      const userDocRef = doc(db, "users", uid);
      const existing = await getDoc(userDocRef);
      if (existing.exists()) {
        await setDoc(
          userDocRef,
          { ...existing.data(), ...updates },
          { merge: true }
        );
      }

      // Also update Firebase Auth profile if current user matches
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
