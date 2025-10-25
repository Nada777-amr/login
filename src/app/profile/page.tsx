'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import TokenStatus from '@/app/components/TokenStatus'
import { useEmailVerificationGuard } from '@/app/hooks/useEmailVerificationGuard'
import { signOutUser, updateUserProfileData } from '@/app/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading, canAccess } = useEmailVerificationGuard({
    requireVerification: true
  });
  const [editing, setEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (userProfile) {
      setNewUsername(userProfile.username || '')
    }
  }, [userProfile])

  const handleLogout = async () => {
    try {
      await signOutUser()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUpdateError('Please select a valid image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setUpdateError('Image size should be less than 5MB')
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setUpdating(true)
    setUpdateError('')
    setUpdateSuccess('')

    try {
      const updateData: { username?: string; photoFile?: File } = {}
      
      if (newUsername.trim() !== userProfile?.username) {
        updateData.username = newUsername.trim()
      }
      
      if (selectedFile) {
        updateData.photoFile = selectedFile
      }

      if (Object.keys(updateData).length === 0) {
        setUpdateError('No changes to update')
        setUpdating(false)
        return
      }

      const result = await updateUserProfileData(user.uid, updateData)
      
      if (result.success) {
        setUpdateSuccess('Profile updated successfully!')
        setEditing(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        setTimeout(() => setUpdateSuccess(''), 3000)
      } else {
        setUpdateError(result.error || 'Failed to update profile')
      }
    } catch (error) {
      setUpdateError('An unexpected error occurred')
      console.error('Profile update error:', error)
    } finally {
      setUpdating(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setNewUsername(userProfile?.username || '')
    setSelectedFile(null)
    setPreviewUrl(null)
    setUpdateError('')
    setUpdateSuccess('')
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDashboardClick = () => {
    router.push('/dashboardd/admin');
  };

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

  if (!canAccess) {
    return null
  }

  const currentPhotoURL = previewUrl || userProfile?.photoURL || user?.photoURL
  const displayName = userProfile?.username || user?.displayName || user?.email

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
            <Link href="/profile" className="text-blue-600 hover:text-blue-800 font-semibold">
              Profile
            </Link>
          </div>

          <div className="flex items-center space-x-2 text-gray-700">
            {currentPhotoURL ? (
              <Image
                src={currentPhotoURL}
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
            <span className="text-sm">{displayName}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Profile & Dashboard
            </h1>
            <p className="mt-2 text-center text-gray-600">
              Manage your profile information and view your account status
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Management */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-lg rounded-lg p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  Profile Information
                </h3>

                {updateSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm">{updateSuccess}</p>
                  </div>
                )}
                
                {updateError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{updateError}</p>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile}>
                  <div className="text-center mb-8">
                    <div className="relative inline-block">
                      {currentPhotoURL ? (
                        <Image
                          src={currentPhotoURL}
                          alt="Profile"
                          width={120}
                          height={120}
                          className="rounded-full mx-auto object-cover"
                        />
                      ) : (
                        <div className="w-30 h-30 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                          <span className="text-gray-600 text-2xl font-bold">
                            {displayName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {editing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={!editing}
                        required
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          !editing ? 'bg-gray-50 text-gray-500' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Status
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user?.emailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user?.emailVerified ? '✅ Email Verified' : '⚠️ Email Not Verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    {!editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                          Edit Profile
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="submit"
                          disabled={updating}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {updating ? 'Updating...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={updating}
                          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Account Overview */}
            <div>
              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Account Overview
                </h3>
                
                <div className="text-center mb-4">
                  {currentPhotoURL ? (
                    <Image
                      src={currentPhotoURL}
                      alt="Profile"
                      width={60}
                      height={60}
                      className="rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-15 h-15 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-gray-600 text-lg font-bold">
                        {displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h4 className="font-medium text-gray-900 mt-2">{displayName}</h4>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Account Info</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Provider: {userProfile?.provider || 'email'}</li>
                      <li>Email: {user?.emailVerified ? 'Verified' : 'Not verified'}</li>
                      <li>
                        Created: {userProfile?.createdAt
                          ? new Date(userProfile.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features</h4>
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

          {/* Token Status Section */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <TokenStatus showDetails={true} />
          </div>

          {/* Professional Dashboard Button - Only for Admin */}
          {userProfile?.role === 'admin' && (
            <div className="flex justify-center pb-8">
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
                <span>Open Admin Dashboard</span>
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
        </div>
      </div>
    </div>
  )
}