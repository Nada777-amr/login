import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    // Parse body JSON
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    let authUserDeleted = false;
    let firestoreUserDeleted = false;

    // ✅ Try to delete user from Firebase Authentication
    try {
      await admin.auth().deleteUser(uid);
      authUserDeleted = true;
      console.log(`✅ Deleted user from Firebase Auth: ${uid}`);
    } catch (authError: any) {
      // If user doesn't exist in Auth, log it but continue to delete from Firestore
      if (authError.code === 'auth/user-not-found') {
        console.warn(`⚠️ User not found in Firebase Auth: ${uid}. Continuing with Firestore deletion.`);
      } else {
        // Re-throw other authentication errors
        throw authError;
      }
    }

    // ✅ Delete user document from Firestore (if exists)
    const userDocRef = admin.firestore().collection("users").doc(uid);
    const doc = await userDocRef.get();

    if (doc.exists) {
      await userDocRef.delete();
      firestoreUserDeleted = true;
      console.log(`✅ Deleted user from Firestore: ${uid}`);
    } else {
      console.warn(`⚠️ User not found in Firestore: ${uid}`);
    }

    // Return success if at least one deletion was successful
    if (authUserDeleted || firestoreUserDeleted) {
      return NextResponse.json({ 
        message: "User deleted successfully",
        details: {
          authDeleted: authUserDeleted,
          firestoreDeleted: firestoreUserDeleted
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: "User not found in Firebase Auth or Firestore" 
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error("🔥 Delete user error:", error);

    // Firebase admin error handling
    let errorMessage = "Failed to delete user.";
    if (error.errorInfo?.message) {
      errorMessage = error.errorInfo.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
