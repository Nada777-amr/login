'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAuthGuardOptions {
  redirectTo?: string
  requireEmailVerified?: boolean
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  
  const {
    redirectTo = '/login',
    requireEmailVerified = false
  } = options

  useEffect(() => {
    if (loading) return // Still loading, wait

    if (!user) {
      router.push(redirectTo)
      return
    }

    if (requireEmailVerified && !user.emailVerified) {
      router.push('/verify-email')
      return
    }
  }, [user, loading, router, redirectTo, requireEmailVerified])

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
  }
}