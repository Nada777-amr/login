'use client'

import React, { useState } from 'react';
import { useTokenExpirationWarning, useTokenManager } from '@/app/hooks/useTokenManager';
import { AlertTriangle, Clock, RefreshCw, X } from 'lucide-react';

interface TokenExpirationWarningProps {
  warningThresholdMinutes?: number;
  className?: string;
}

export const TokenExpirationWarning: React.FC<TokenExpirationWarningProps> = ({
  warningThresholdMinutes = 60,
  className = '',
}) => {
  const { shouldShowWarning, warningMessage, firebaseExpiresIn, githubExpiresIn } = 
    useTokenExpirationWarning(warningThresholdMinutes);
  const { refreshTokens, forceRefresh, loading } = useTokenManager();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshTokens();
      if (!result.success) {
        console.error('Token refresh failed:', result.errors);
        // Try force refresh as fallback
        await forceRefresh();
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Auto-show again after 10 minutes
    setTimeout(() => setIsDismissed(false), 10 * 60 * 1000);
  };

  if (!shouldShowWarning || isDismissed || loading) {
    return null;
  }

  const isUrgent = firebaseExpiresIn <= 15 || githubExpiresIn <= 15;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4
      ${isUrgent 
        ? 'bg-red-50 border-red-500 text-red-800' 
        : 'bg-yellow-50 border-yellow-500 text-yellow-800'
      }
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">
            {isUrgent ? 'Session Expiring Soon!' : 'Session Expiration Warning'}
          </h4>
          <p className="text-sm mb-3">{warningMessage}</p>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`
                flex items-center gap-1 px-3 py-1 text-xs font-medium rounded
                ${isUrgent 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              `}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Extend Session'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded border border-current hover:bg-black hover:bg-opacity-10 transition-colors duration-200"
            >
              <X className="w-3 h-3" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationWarning;