import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    try {
      // Update user in Firebase Auth to mark email as verified
      await admin.auth().updateUser(uid, {
        emailVerified: true,
      });

      // Also update in Firestore
      const userDocRef = admin.firestore().collection("users").doc(uid);
      const doc = await userDocRef.get();

      if (doc.exists) {
        await userDocRef.update({
          emailVerified: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(`✅ Email verified for user: ${uid}`);

      return NextResponse.json({
        message: "Email verified successfully",
        uid,
      });
    } catch (firebaseError: any) {
      if (firebaseError.code === "auth/user-not-found") {
        return NextResponse.json(
          { error: "User not found in Firebase Authentication" },
          { status: 404 }
        );
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error("❌ Error in verify-user-email route:", error);

    let errorMessage = "Failed to verify email";
    if (error.errorInfo?.message) {
      errorMessage = error.errorInfo.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
