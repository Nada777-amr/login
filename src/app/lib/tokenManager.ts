import { auth } from './firebase';
import { signOutUser } from './auth';

export interface TokenData {
  token: string;
  expirationTime: number;
  createdAt: number;
  provider?: string;
}

export interface StoredTokenData {
  firebase: TokenData | null;
  github: TokenData | null;
  lastRefresh: number;
}

// Token expiration duration: 7 days in milliseconds
export const TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
export const REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 1 day before expiration

// Storage keys
const STORAGE_KEY = 'auth_tokens';
const EXPIRATION_KEY = 'token_expiration';

/**
 * Get stored token data from localStorage
 */
export const getStoredTokens = (): StoredTokenData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as StoredTokenData;
    return parsed;
  } catch (error) {
    console.error('Error parsing stored tokens:', error);
    return null;
  }
};

/**
 * Store token data in localStorage
 */
export const storeTokens = (tokenData: StoredTokenData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
    localStorage.setItem(EXPIRATION_KEY, tokenData.firebase?.expirationTime.toString() || '0');
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

/**
 * Clear stored tokens
 */
export const clearStoredTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EXPIRATION_KEY);
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (tokenData: TokenData | null): boolean => {
  if (!tokenData) return true;
  
  const now = Date.now();
  return now >= tokenData.expirationTime;
};

/**
 * Check if a token needs refresh (within 1 day of expiration)
 */
export const shouldRefreshToken = (tokenData: TokenData | null): boolean => {
  if (!tokenData) return false;
  
  const now = Date.now();
  return now >= (tokenData.expirationTime - REFRESH_THRESHOLD);
};

/**
 * Create token data with expiration
 */
export const createTokenData = (token: string, provider?: string): TokenData => {
  const now = Date.now();
  return {
    token,
    expirationTime: now + TOKEN_EXPIRATION_TIME,
    createdAt: now,
    provider
  };
};

/**
 * Get current Firebase ID token and store it with expiration
 */
export const storeFirebaseToken = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const idToken = await user.getIdToken();
    const tokenData = createTokenData(idToken, 'firebase');
    
    const stored = getStoredTokens() || { firebase: null, github: null, lastRefresh: Date.now() };
    stored.firebase = tokenData;
    stored.lastRefresh = Date.now();
    
    storeTokens(stored);
    return true;
  } catch (error) {
    console.error('Error storing Firebase token:', error);
    return false;
  }
};

/**
 * Store GitHub token data
 */
export const storeGitHubToken = (accessToken: string): void => {
  const tokenData = createTokenData(accessToken, 'github');
  
  const stored = getStoredTokens() || { firebase: null, github: null, lastRefresh: Date.now() };
  stored.github = tokenData;
  stored.lastRefresh = Date.now();
  
  storeTokens(stored);
};

/**
 * Refresh Firebase token if needed
 */
export const refreshFirebaseToken = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const idToken = await user.getIdToken(true); // Force refresh
    const tokenData = createTokenData(idToken, 'firebase');
    
    const stored = getStoredTokens() || { firebase: null, github: null, lastRefresh: Date.now() };
    stored.firebase = tokenData;
    stored.lastRefresh = Date.now();
    
    storeTokens(stored);
    return true;
  } catch (error) {
    console.error('Error refreshing Firebase token:', error);
    return false;
  }
};

/**
 * Check and handle token expiration
 */
export const checkTokenExpiration = async (): Promise<{ expired: boolean; provider?: string }> => {
  const stored = getStoredTokens();
  if (!stored) return { expired: false };
  
  // Check Firebase token
  if (stored.firebase && isTokenExpired(stored.firebase)) {
    console.log('Firebase token expired');
    await handleExpiredSession();
    return { expired: true, provider: 'firebase' };
  }
  
  // Check GitHub token
  if (stored.github && isTokenExpired(stored.github)) {
    console.log('GitHub token expired');
    await handleExpiredSession();
    return { expired: true, provider: 'github' };
  }
  
  return { expired: false };
};

/**
 * Handle expired session - sign out user and clear tokens
 */
export const handleExpiredSession = async (): Promise<void> => {
  try {
    console.log('Handling expired session...');
    
    // Clear stored tokens
    clearStoredTokens();
    
    // Sign out from Firebase
    await signOutUser();
    
    // Redirect to login page if on client side
    if (typeof window !== 'undefined') {
      // Show expiration message
      localStorage.setItem('session_expired', 'true');
      
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error handling expired session:', error);
  }
};

/**
 * Initialize token monitoring on app start
 */
export const initializeTokenMonitoring = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check for expired session message
  const sessionExpired = localStorage.getItem('session_expired');
  if (sessionExpired) {
    localStorage.removeItem('session_expired');
    // You can show a toast or notification here
    console.log('Previous session expired');
  }
  
  // Set up periodic token check (every 30 minutes)
  const checkInterval = setInterval(async () => {
    await checkTokenExpiration();
  }, 30 * 60 * 1000);
  
  // Check tokens on page visibility change
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      await checkTokenExpiration();
    }
  });
  
  // Clear interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(checkInterval);
  });
};

/**
 * Get time until token expiration in minutes
 */
export const getTimeUntilExpiration = (tokenData: TokenData | null): number => {
  if (!tokenData) return 0;
  
  const now = Date.now();
  const timeLeft = tokenData.expirationTime - now;
  return Math.max(0, Math.floor(timeLeft / (60 * 1000))); // Return minutes
};

/**
 * Get formatted expiration time string
 */
export const getExpirationTimeString = (tokenData: TokenData | null): string => {
  if (!tokenData) return 'No token';
  
  const expirationDate = new Date(tokenData.expirationTime);
  return expirationDate.toLocaleString();
};

/**
 * Force token refresh for all providers
 */
export const forceTokenRefresh = async (): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];
  let success = true;
  
  try {
    // Refresh Firebase token
    const firebaseRefreshed = await refreshFirebaseToken();
    if (!firebaseRefreshed) {
      errors.push('Failed to refresh Firebase token');
      success = false;
    }
    
    // Note: GitHub tokens can't be refreshed without user interaction
    // We would need to re-authenticate with GitHub
    
  } catch (error) {
    console.error('Error during force token refresh:', error);
    errors.push('Unexpected error during token refresh');
    success = false;
  }
  
  return { success, errors };
};