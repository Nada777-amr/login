import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    // Parse body JSON
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    // ✅ Delete user from Firebase Authentication
    await admin.auth().deleteUser(uid);

    // ✅ Delete user document from Firestore (if exists)
    const userDocRef = admin.firestore().collection("users").doc(uid);
    const doc = await userDocRef.get();

    if (doc.exists) {
      await userDocRef.delete();
    }

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

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
