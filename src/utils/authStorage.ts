/**
 * Auth Storage Management Utility
 *
 * Provides targeted clearing of Supabase authentication keys only.
 * Preserves React Query cache, user preferences, and other app state.
 *
 * @see docs/01-system-architecture/AUTHENTICATION_SYSTEM.md
 */

const PROJECT_ID = 'mymzcbalyqqgdmzsfmam';

const AUTH_KEYS = [
  `sb-${PROJECT_ID}-auth-token`,
  `sb-${PROJECT_ID}-auth-token-code-verifier`,
] as const;

/**
 * Clears only Supabase auth tokens from localStorage and sessionStorage.
 * Preserves React Query cache and user preferences.
 */
export const clearAuthStorage = (): void => {
  console.log('🧹 Clearing auth-specific storage...');

  let clearedCount = 0;

  AUTH_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      clearedCount++;
    }
  });

  // Clear impersonation state
  sessionStorage.removeItem('appbase_impersonation_user_id');

  console.log(`✅ Cleared ${clearedCount} auth storage keys`);
};

/**
 * Clears only Supabase auth cookies (targets cookies with project prefix).
 * Preserves other application cookies.
 */
export const clearAuthCookies = (): void => {
  console.log('🧹 Clearing auth-specific cookies...');

  const authCookiePrefix = `sb-${PROJECT_ID}`;

  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith(authCookiePrefix)) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
};

/**
 * Comprehensive auth state clearing (storage + cookies).
 * Use this for login/logout flows to ensure complete auth reset.
 */
export const clearAuthState = (): void => {
  clearAuthStorage();
  clearAuthCookies();
};
