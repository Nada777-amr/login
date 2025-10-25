"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  signInWithEmail,
  signInWithGitHub,
} from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Check for email verification success on page load
  useEffect(() => {
    const emailVerified = localStorage.getItem('email_verified');
    if (emailVerified === 'true') {
      setVerificationSuccess(true);
      localStorage.removeItem('email_verified');
      // Hide the success message after 10 seconds
      setTimeout(() => {
        setVerificationSuccess(false);
      }, 10000);
    }
    
    const needsVerification = localStorage.getItem('verification_required');
    if (needsVerification === 'true') {
      setVerificationRequired(true);
      localStorage.removeItem('verification_required');
      // Hide the message after 15 seconds
      setTimeout(() => {
        setVerificationRequired(false);
      }, 15000);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/profile");
    }
  }, [user, authLoading, router]);

  // Show loading if auth is loading or if user is authenticated (about to redirect)
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {user ? "Redirecting..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signInWithEmail(email, password);

      if (result.success) {
        // Don't redirect manually - let the useEffect handle it when auth state changes
        console.log(
          "Email login successful, auth state will trigger redirect to profile..."
        );
        // Keep loading state until redirect happens
      } else {
        // Check if it's a verification error
        if ('needsVerification' in result && result.needsVerification) {
          // Store flag for verification required message
          localStorage.setItem('verification_required', 'true');
        }
        setError(result.error || "Login failed");
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Starting GitHub login...");
      const result = await signInWithGitHub();
      console.log("GitHub login result:", result);

      if (result.success) {
        // GitHub users are automatically verified, redirect to profile
        console.log(
          "GitHub login successful, redirecting to profile..."
        );
        router.push('/profile');
      } else {
        console.log("GitHub login failed:", result.error);
        setError(result.error || "GitHub login failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      setError(
        "An unexpected error occurred. Please check your internet connection and try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex space-x-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Login
          </Link>
          <Link href="/signup" className="text-blue-600 hover:text-blue-800">
            Signup
          </Link>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Login Page
            </h1>
          </div>

          {/* Email Verification Success Message */}
          {verificationSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-800 font-semibold">
                  Your email has been verified. You can now log in.
                </p>
              </div>
            </div>
          )}
          
          {/* Email Verification Required Message */}
          {verificationRequired && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-yellow-800 font-semibold">
                    Email verification required
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please check your email and click the verification link before logging in.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing In..." : "Login"}
                </button>

                <button
                  type="button"
                  onClick={handleGitHubLogin}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                    />
                  </svg>
                  Sign in with GitHub
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
}
