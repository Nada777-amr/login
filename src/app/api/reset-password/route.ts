// app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const link = await admin.auth().generatePasswordResetLink(email);
    return NextResponse.json({ message: "Password reset link generated", link });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
