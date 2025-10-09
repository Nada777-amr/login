"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      
      // Check if this is an email verification link
      if (mode !== 'verifyEmail' || !oobCode) {
        setVerificationStatus('invalid');
        return;
      }

      try {
        // Verify the action code is valid
        await checkActionCode(auth, oobCode);
        
        // Apply the email verification
        await applyActionCode(auth, oobCode);
        
        setVerificationStatus('success');
        
        // Store verification success for login page to detect
        localStorage.setItem('email_verified', 'true');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
        
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        
        if (error instanceof Error) {
          if (error.message.includes('expired')) {
            setErrorMessage('The verification link has expired. Please request a new one.');
          } else if (error.message.includes('invalid')) {
            setErrorMessage('The verification link is invalid.');
          } else {
            setErrorMessage('Failed to verify email. Please try again.');
          }
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex space-x-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Login
          </Link>
          <Link href="/signup" className="text-blue-600 hover:text-blue-800">
            Signup
          </Link>
        </div>
      </nav>

      {/* Verification Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Email Verification
            </h1>
          </div>

          <div className="text-center space-y-4">
            {verificationStatus === 'loading' && (
              <div>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Verifying your email...</p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div>
                <div className="p-6 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-800 mb-2">
                    Email Verified Successfully!
                  </h2>
                  <p className="text-green-700">
                    Your email has been verified. You can now log in to your account.
                  </p>
                  <p className="text-green-600 text-sm mt-2">
                    Redirecting to login page in 3 seconds...
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block mt-4 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Login Now
                </Link>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div>
                <div className="p-6 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-red-800 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-red-700 mb-4">
                    {errorMessage}
                  </p>
                  <div className="space-y-2">
                    <Link
                      href="/signup"
                      className="block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 text-center"
                    >
                      Sign Up Again
                    </Link>
                    <Link
                      href="/login"
                      className="block w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
                    >
                      Go to Login
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {verificationStatus === 'invalid' && (
              <div>
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-yellow-800 mb-2">
                    Invalid Verification Link
                  </h2>
                  <p className="text-yellow-700 mb-4">
                    This verification link is invalid or malformed. Please check your email for the correct link or request a new verification email.
                  </p>
                  <div className="space-y-2">
                    <Link
                      href="/signup"
                      className="block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 text-center"
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/login"
                      className="block w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
                    >
                      Go to Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
