import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  getStoredTokens, 
  isTokenExpired, 
  shouldRefreshToken,
  getTimeUntilExpiration,
  getExpirationTimeString,
  forceTokenRefresh,
  type StoredTokenData,
  type TokenData 
} from '@/app/lib/tokenManager';

export interface TokenStatus {
  firebase: {
    isValid: boolean;
    needsRefresh: boolean;
    expiresIn: number; // minutes
    expirationDate: string;
    token: TokenData | null;
  };
  github: {
    isValid: boolean;
    needsRefresh: boolean;
    expiresIn: number; // minutes
    expirationDate: string;
    token: TokenData | null;
  };
}

export interface UseTokenManagerReturn {
  tokenStatus: TokenStatus;
  isAnyTokenExpired: boolean;
  refreshTokens: () => Promise<{ success: boolean; errors: string[] }>;
  forceRefresh: () => Promise<{ success: boolean; errors: string[] }>;
  loading: boolean;
  lastChecked: Date | null;
}

/**
 * Hook for managing and monitoring authentication tokens
 */
export const useTokenManager = (): UseTokenManagerReturn => {
  const { tokenData, tokenExpired, refreshTokens: contextRefresh } = useAuth();
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    firebase: {
      isValid: false,
      needsRefresh: false,
      expiresIn: 0,
      expirationDate: 'No token',
      token: null,
    },
    github: {
      isValid: false,
      needsRefresh: false,
      expiresIn: 0,
      expirationDate: 'No token',
      token: null,
    },
  });
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Update token status
  const updateTokenStatus = useCallback(() => {
    const stored = getStoredTokens();
    
    const firebaseStatus = {
      isValid: stored?.firebase ? !isTokenExpired(stored.firebase) : false,
      needsRefresh: stored?.firebase ? shouldRefreshToken(stored.firebase) : false,
      expiresIn: getTimeUntilExpiration(stored?.firebase || null),
      expirationDate: getExpirationTimeString(stored?.firebase || null),
      token: stored?.firebase || null,
    };

    const githubStatus = {
      isValid: stored?.github ? !isTokenExpired(stored.github) : false,
      needsRefresh: stored?.github ? shouldRefreshToken(stored.github) : false,
      expiresIn: getTimeUntilExpiration(stored?.github || null),
      expirationDate: getExpirationTimeString(stored?.github || null),
      token: stored?.github || null,
    };

    setTokenStatus({
      firebase: firebaseStatus,
      github: githubStatus,
    });
    
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  // Initialize and set up periodic updates
  useEffect(() => {
    updateTokenStatus();
    
    // Update every minute
    const interval = setInterval(updateTokenStatus, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [updateTokenStatus, tokenData]);

  // Refresh tokens using context method
  const refreshTokens = useCallback(async (): Promise<{ success: boolean; errors: string[] }> => {
    try {
      await contextRefresh();
      updateTokenStatus();
      return { success: true, errors: [] };
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }, [contextRefresh, updateTokenStatus]);

  // Force refresh all tokens
  const forceRefresh = useCallback(async (): Promise<{ success: boolean; errors: string[] }> => {
    try {
      const result = await forceTokenRefresh();
      updateTokenStatus();
      return result;
    } catch (error) {
      console.error('Error force refreshing tokens:', error);
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }, [updateTokenStatus]);

  const isAnyTokenExpired = tokenExpired || !tokenStatus.firebase.isValid;

  return {
    tokenStatus,
    isAnyTokenExpired,
    refreshTokens,
    forceRefresh,
    loading,
    lastChecked,
  };
};

/**
 * Hook to get a simplified token expiration warning
 */
export const useTokenExpirationWarning = (warningThresholdMinutes: number = 60) => {
  const { tokenStatus } = useTokenManager();
  
  const shouldShowWarning = 
    (tokenStatus.firebase.isValid && tokenStatus.firebase.expiresIn <= warningThresholdMinutes) ||
    (tokenStatus.github.isValid && tokenStatus.github.expiresIn <= warningThresholdMinutes);
    
  const getWarningMessage = (): string | null => {
    if (!shouldShowWarning) return null;
    
    const messages: string[] = [];
    
    if (tokenStatus.firebase.isValid && tokenStatus.firebase.expiresIn <= warningThresholdMinutes) {
      messages.push(`Firebase session expires in ${tokenStatus.firebase.expiresIn} minutes`);
    }
    
    if (tokenStatus.github.isValid && tokenStatus.github.expiresIn <= warningThresholdMinutes) {
      messages.push(`GitHub authorization expires in ${tokenStatus.github.expiresIn} minutes`);
    }
    
    return messages.join('. ');
  };
  
  return {
    shouldShowWarning,
    warningMessage: getWarningMessage(),
    firebaseExpiresIn: tokenStatus.firebase.expiresIn,
    githubExpiresIn: tokenStatus.github.expiresIn,
  };
};