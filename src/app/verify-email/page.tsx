'use client'

import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { signOutUser } from '@/app/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await signOutUser()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const displayName = userProfile?.username || user.displayName || user.email
  const profilePhotoURL = userProfile?.photoURL || user.photoURL

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex space-x-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Login
            </Link>
            <Link href="/signup" className="text-blue-600 hover:text-blue-800">
              Signup
            </Link>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-semibold">
              Dashboard
            </Link>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/profile" 
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
            >
              {profilePhotoURL ? (
                <Image
                  src={profilePhotoURL}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">
                    {displayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm">Profile</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Dashboard
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                  <div className="mb-4">
                    {profilePhotoURL ? (
                      <Image
                        src={profilePhotoURL}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="rounded-full mx-auto object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                        <span className="text-gray-600 text-xl font-bold">
                          {displayName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {displayName}
                  </h2>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>{user.email}</p>
                    <p className="capitalize">{userProfile?.provider || 'email'} Account</p>
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.emailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link
                      href="/profile"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-block text-center"
                    >
                      Manage Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Welcome Back!</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800 text-sm">
                      🎉 You're successfully authenticated! This is your protected dashboard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Account Info</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>Provider: {userProfile?.provider || 'email'}</li>
                        <li>Email: {user.emailVerified ? 'Verified' : 'Not verified'}</li>
                        <li>Created: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</li>
                      </ul>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                      <div className="space-y-2">
                        <Link
                          href="/profile"
                          className="block text-sm text-blue-600 hover:text-blue-800"
                        >
                          → Edit Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block text-sm text-red-600 hover:text-red-800"
                        >
                          → Sign Out
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Available Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Profile management</li>
                      <li>✓ Photo upload</li>
                      <li>✓ Username updates</li>
                      <li>✓ Secure authentication</li>
                      <li>✓ Session management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}