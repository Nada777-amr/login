'use client'

import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { signOutUser, updateUserProfileData } from '@/app/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setUpdateError('Please select a valid image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUpdateError('Image size should be less than 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
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
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Clear success message after 3 seconds
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

  const currentPhotoURL = previewUrl || userProfile?.photoURL || user.photoURL
  const displayName = userProfile?.username || user.displayName || user.email

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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Dashboard
          </Link>
          <Link href="/profile" className="text-blue-600 hover:text-blue-800 font-semibold">
            Profile
          </Link>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Profile Management
            </h1>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-8">
            {/* Profile Picture Section */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Success/Error Messages */}
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

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={!editing}
                    required
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      !editing ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                    placeholder="Enter your username"
                  />
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Provider Field (Read-only) */}
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                    Sign-in Provider
                  </label>
                  <input
                    id="provider"
                    name="provider"
                    type="text"
                    value={userProfile?.provider || 'email'}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Status
                  </label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.emailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.emailVerified ? '✅ Email Verified' : '⚠️ Email Not Verified'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Member since: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                {!editing ? (
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Edit Profile
                    </button>
                    <Link
                      href="/dashboard"
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
                    >
                      Back to Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? 'Updating...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={updating}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}