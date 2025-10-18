'use client'

import { useEffect } from 'react';
import { initializeTokenMonitoring } from '@/app/lib/tokenManager';

/**
 * Component to initialize token monitoring on app startup
 * Should be included in the root layout or main app component
 */
export const TokenMonitoringInitializer: React.FC = () => {
  useEffect(() => {
    // Initialize token monitoring when component mounts
    initializeTokenMonitoring();
    
    // Check for expired session message on startup
    const sessionExpired = localStorage.getItem('session_expired');
    if (sessionExpired) {
      localStorage.removeItem('session_expired');
      
      // You can customize this notification
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          alert('Your previous session expired. Please sign in again.');
        }, 1000);
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default TokenMonitoringInitializer;