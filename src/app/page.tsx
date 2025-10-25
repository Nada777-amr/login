'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { userProfile } = useAuth();

  const handleDashboardClick = () => {
    router.push('/dashboardd/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex space-x-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
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

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              MVP Authentication System
            </h1>
            <p className="mt-3 text-xl text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              A simple, production-ready authentication system built with Next.js and Firebase
            </p>
          </div>
          
          <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
            <div className="rounded-md shadow">
              <Link
                href="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started - Login
              </Link>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <Link
                href="/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Professional Dashboard Button - Only for Admin */}
          {userProfile?.role === 'admin' && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleDashboardClick}
                className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg 
                  className="w-5 h-5 transition-transform group-hover:rotate-12" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                  />
                </svg>
                <span>Open Dashboard</span>
                <svg 
                  className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Guest access - try features without registration
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Email/Password authentication
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                GitHub social login
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Email verification
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Admin dashboard for user management
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Protected profile & dashboard
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
