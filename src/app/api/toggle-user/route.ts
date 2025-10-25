import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { uid, disabled } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    if (typeof disabled !== 'boolean') {
      return NextResponse.json({ error: "Disabled status must be a boolean" }, { status: 400 });
    }

    try {
      // Check if user exists first
      const userRecord = await admin.auth().getUser(uid);
      console.log("✅ Found user:", userRecord.email);

      // Update user disabled status
      await admin.auth().updateUser(uid, { disabled });
      
      // Also update in Firestore if document exists
      const userDocRef = admin.firestore().collection("users").doc(uid);
      const doc = await userDocRef.get();
      
      if (doc.exists) {
        await userDocRef.update({ 
          disabled,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return NextResponse.json({ 
        message: `User ${disabled ? "disabled" : "enabled"} successfully`,
        email: userRecord.email
      });
    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/user-not-found') {
        console.warn("⚠️ User not found in Firebase Auth:", uid);
        return NextResponse.json({ 
          error: "User not found in Firebase Authentication" 
        }, { status: 404 });
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error("❌ Error in toggle-user route:", error);
    
    let errorMessage = "Failed to update user status";
    if (error.errorInfo?.message) {
      errorMessage = error.errorInfo.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
