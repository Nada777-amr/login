import { NextResponse } from "next/server";
import admin from "@/app/lib/firebaseAdmin";
import { sendVerificationEmail } from "@/app/lib/emailService";

export async function POST(request: Request) {
  try {
    const { email, password, username, role } = await request.json();

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters as per Firebase requirement)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    try {
      // Create user in Firebase Authentication using Admin SDK
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: username,
        emailVerified: false, // Require email verification
      });

      // Create user document in Firestore
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        username,
        email,
        role: role || "user",
        provider: "email",
        disabled: false,
        emailVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate email verification link
      console.log(`🔗 [CREATE USER] Generating email verification link for: ${email}`);
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);

      console.log(`✅ User created successfully: ${email}`);
      console.log(`📧 Email verification link: ${verificationLink}`);

      // Send verification email to user
      console.log(`📤 [CREATE USER] Calling sendVerificationEmail for: ${email}`);
      const emailResult = await sendVerificationEmail(email, username, verificationLink);
      console.log(`📊 [CREATE USER] Email result:`, emailResult);
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // User was created successfully, but email failed
        // Return link as fallback
        return NextResponse.json(
          {
            message: "User created but verification email failed to send",
            user: {
              uid: userRecord.uid,
              email: userRecord.email,
              username,
              role: role || "user",
            },
            verificationLink, // Return link for manual sharing
            emailSent: false,
            error: emailResult.error,
            note: "Email service error. Please share this link with the user manually."
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        {
          message: "User created successfully and verification email sent",
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            username,
            role: role || "user",
          },
          emailSent: true
        },
        { status: 201 }
      );
    } catch (firebaseError: any) {
      // Handle specific Firebase errors
      if (firebaseError.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "This email is already registered" },
          { status: 409 }
        );
      }

      if (firebaseError.code === "auth/invalid-email") {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        );
      }

      if (firebaseError.code === "auth/weak-password") {
        return NextResponse.json(
          { error: "Password is too weak" },
          { status: 400 }
        );
      }

      throw firebaseError;
    }
  } catch (error: any) {
    console.error("🔥 Create user error:", error);

    let errorMessage = "Failed to create user";
    if (error.errorInfo?.message) {
      errorMessage = error.errorInfo.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
