import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export interface UseEmailVerificationGuardOptions {
  redirectTo?: string;
  requireVerification?: boolean;
}

/**
 * Hook that redirects unverified email users to login page
 * GitHub/Google users are automatically considered verified
 */
export const useEmailVerificationGuard = (options: UseEmailVerificationGuardOptions = {}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const { redirectTo = '/login', requireVerification = true } = options;

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // If no user, redirect to login
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // If verification is required and user has email provider but not verified
    if (requireVerification && userProfile) {
      const isEmailProvider = userProfile.provider === 'email';
      const isVerified = user.emailVerified || userProfile.emailVerified;
      
      if (isEmailProvider && !isVerified) {
        // Store a message for the login page
        localStorage.setItem('verification_required', 'true');
        router.push('/login');
        return;
      }
    }
  }, [user, userProfile, loading, router, redirectTo, requireVerification]);

  const isEmailProvider = userProfile?.provider === 'email';
  const isVerified = user?.emailVerified || userProfile?.emailVerified || false;
  const needsVerification = isEmailProvider && !isVerified;

  return {
    user,
    userProfile,
    loading,
    isVerified,
    needsVerification,
    isEmailProvider,
    canAccess: !loading && user && (!requireVerification || isVerified || !isEmailProvider)
  };
};