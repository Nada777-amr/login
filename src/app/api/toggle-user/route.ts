import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { uid, disabled } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    try {
      const userRecord = await admin.auth().getUser(uid);
      console.log("✅ Found user:", userRecord.email);

      await admin.auth().updateUser(uid, { disabled });
      return NextResponse.json({ message: `User ${disabled ? "disabled" : "enabled"} successfully` });
    } catch (firebaseError: any) {
      // المستخدم مش في Firebase Auth
      console.warn("⚠️ User not found in Firebase Auth, skipping disable:", uid);
      return NextResponse.json({ error: "User not found in Firebase Authentication" }, { status: 404 });
    }

  } catch (error: any) {
    console.error("❌ Error in toggle-user route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
