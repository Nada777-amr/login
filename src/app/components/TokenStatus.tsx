'use client'

import React, { useState } from 'react';
import { useTokenManager } from '@/app/hooks/useTokenManager';
import { Clock, RefreshCw, Shield, Github, AlertTriangle, Check } from 'lucide-react';

interface TokenStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const TokenStatus: React.FC<TokenStatusProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const { tokenStatus, isAnyTokenExpired, refreshTokens, forceRefresh, loading, lastChecked } = useTokenManager();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshTokens();
      if (!result.success) {
        console.error('Token refresh failed:', result.errors);
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await forceRefresh();
      if (!result.success) {
        console.error('Force refresh failed:', result.errors);
      }
    } catch (error) {
      console.error('Error force refreshing tokens:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeLeft = (minutes: number): string => {
    if (minutes <= 0) return 'Expired';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getStatusColor = (isValid: boolean, needsRefresh: boolean) => {
    if (!isValid) return 'text-red-600';
    if (needsRefresh) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (isValid: boolean, needsRefresh: boolean) => {
    if (!isValid) return <AlertTriangle className="w-4 h-4" />;
    if (needsRefresh) return <Clock className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking token status...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Authentication Status</h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Force Refresh
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firebase Token Status */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <h4 className="font-medium text-gray-900">Firebase Session</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(tokenStatus.firebase.isValid, tokenStatus.firebase.needsRefresh)}
                <span className={getStatusColor(tokenStatus.firebase.isValid, tokenStatus.firebase.needsRefresh)}>
                  {tokenStatus.firebase.isValid ? 'Valid' : 'Expired'}
                  {tokenStatus.firebase.needsRefresh && tokenStatus.firebase.isValid && ' (Needs Refresh)'}
                </span>
              </div>
              
              <div className="text-gray-600">
                <div>Expires in: <span className="font-medium">{formatTimeLeft(tokenStatus.firebase.expiresIn)}</span></div>
                <div className="text-xs text-gray-500 mt-1">
                  {tokenStatus.firebase.expirationDate}
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Token Status */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Github className="w-4 h-4 text-gray-900" />
              <h4 className="font-medium text-gray-900">GitHub Authorization</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              {tokenStatus.github.token ? (
                <>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tokenStatus.github.isValid, tokenStatus.github.needsRefresh)}
                    <span className={getStatusColor(tokenStatus.github.isValid, tokenStatus.github.needsRefresh)}>
                      {tokenStatus.github.isValid ? 'Valid' : 'Expired'}
                      {tokenStatus.github.needsRefresh && tokenStatus.github.isValid && ' (Needs Refresh)'}
                    </span>
                  </div>
                  
                  <div className="text-gray-600">
                    <div>Expires in: <span className="font-medium">{formatTimeLeft(tokenStatus.github.expiresIn)}</span></div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tokenStatus.github.expirationDate}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">No GitHub token</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Checked */}
      <div className="text-xs text-gray-500 text-center">
        Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
      </div>

      {/* Expiration Warning */}
      {isAnyTokenExpired && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">Session Expired</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Your session has expired. Please sign in again to continue.
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenStatus;