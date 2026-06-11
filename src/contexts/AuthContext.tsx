/* eslint-disable react-refresh/only-export-components -- canonical React context pattern: useAuth hook co-located with AuthProvider; splitting breaks the standard import */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toastHelper';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  name: string;
  is_approved: boolean;
  is_active: boolean;
}

interface UserModule {
  module_id: string;
  name: string;
  description: string;
  icon_name: string;
  path: string;
  category: string;
  sort_order: number;
}

interface AuthContextType {
  // These return impersonated values when impersonating, real values otherwise
  user: AuthUser | null;
  profile: UserProfile | null;
  modules: UserModule[];
  capabilities: string[];
  hasCapability: (capability: string) => boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;

  // Impersonation
  isImpersonating: boolean;
  realUser: AuthUser | null;
  realProfile: UserProfile | null;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  impersonationLoading: boolean;
}

const IMPERSONATION_KEY = 'appbase_impersonation_user_id';

/**
 * Extract `app_metadata.role` from a Supabase access token. RLS helpers
 * (`is_field_or_above`, `has_capability`) read this claim — if it lags the
 * `users.role` value, every write that depends on a capability policy fails
 * with "new row violates row-level security policy". Used to detect a stale
 * JWT and trigger `refreshSession()` once per cold start.
 */
function parseJwtAppMetadataRole(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return decoded?.app_metadata?.role ?? null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Real user state (always the actual logged-in user)
  const [realUser, setRealUser] = useState<AuthUser | null>(null);
  const [realProfile, setRealProfile] = useState<UserProfile | null>(null);
  const [realModules, setRealModules] = useState<UserModule[]>([]);
  const [realCapabilities, setRealCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Impersonation state
  const [impersonatedUser, setImpersonatedUser] = useState<AuthUser | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
  const [impersonatedModules, setImpersonatedModules] = useState<UserModule[]>([]);
  const [impersonatedCapabilities, setImpersonatedCapabilities] = useState<string[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationLoading, setImpersonationLoading] = useState(false);

  const clearImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    setImpersonatedProfile(null);
    setImpersonatedModules([]);
    setImpersonatedCapabilities([]);
    setIsImpersonating(false);
    sessionStorage.removeItem(IMPERSONATION_KEY);
  }, []);

  const startImpersonation = useCallback(async (userId: string) => {
    // Guard: only super_admin can impersonate
    if (realUser?.role !== 'super_admin') return;

    // Guard: cannot impersonate yourself
    if (userId === realUser?.id) {
      clearImpersonation();
      return;
    }

    setImpersonationLoading(true);
    try {
      // Fetch target user profile via get_all_users RPC and find by ID
      const { data: allUsers, error: usersError } = await supabase.rpc('get_all_users');

      if (usersError || !allUsers) {
        showError('Failed to load user data for impersonation');
        return;
      }

      const targetUser = allUsers.find((u) => u.id === userId);
      if (!targetUser) {
        showError('User not found');
        return;
      }

      if (!targetUser.is_active || !targetUser.is_approved) {
        showError('Cannot impersonate inactive or unapproved user');
        return;
      }

      // Fetch target user's modules
      const { data: userModules, error: modulesError } = await supabase.rpc(
        'get_user_modules',
        { p_user_id: userId }
      );

      if (modulesError) {
        showError('Failed to load user modules for impersonation');
        return;
      }

      // Fetch target user's capabilities (derived from role via rls_capabilities)
      const { data: userCaps } = await supabase
        .from('rls_capabilities')
        .select('capability')
        .eq('role', targetUser.role)
        .limit(5000);

      // Set impersonated state
      setImpersonatedUser({
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      });
      setImpersonatedProfile({
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        name: targetUser.name,
        is_approved: targetUser.is_approved,
        is_active: targetUser.is_active,
      });
      setImpersonatedModules(userModules || []);
      setImpersonatedCapabilities((userCaps || []).map(c => c.capability));
      setIsImpersonating(true);

      // Persist to sessionStorage (per-tab, survives refresh)
      sessionStorage.setItem(IMPERSONATION_KEY, userId);

      showSuccess(`Now viewing as ${targetUser.name} (${targetUser.role})`);
    } catch (error) {
      console.error('Impersonation error:', error);
      showError('Failed to start impersonation');
    } finally {
      setImpersonationLoading(false);
    }
  }, [realUser, clearImpersonation]);

  const stopImpersonation = useCallback(() => {
    clearImpersonation();
    showSuccess('Returned to your own view');
  }, [clearImpersonation]);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');

      // Step 1: Get session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('No session found');
        setRealUser(null);
        setRealProfile(null);
        setRealModules([]);
        setRealCapabilities([]);
        clearImpersonation();
        setLoading(false);
        return;
      }

      console.log('Session found');

      // Step 2: Get user profile
      const { data: userProfile, error: profileError } = await supabase.rpc('get_user_profile');

      if (profileError || !userProfile?.[0]) {
        console.error('Profile error:', profileError);
        await supabase.auth.signOut();
        setRealUser(null);
        setRealProfile(null);
        setRealModules([]);
        setRealCapabilities([]);
        clearImpersonation();
        setLoading(false);
        return;
      }

      const profileData = userProfile[0];

      // Step 2.5: Self-heal stale JWT (app_metadata.role lags users.role).
      // Happens when an admin changes a user's role mid-session — the iPad
      // session keeps a JWT with the old role until refresh, and every RLS
      // capability policy fails. One refreshSession() rehydrates app_metadata.
      const jwtRole = parseJwtAppMetadataRole(session.access_token);
      if (jwtRole !== profileData.role) {
        console.warn(
          `Stale JWT app_metadata.role (${jwtRole ?? 'null'}) ≠ DB role (${profileData.role}). Refreshing session.`
        );
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('refreshSession failed:', refreshError);
        }
      }

      // Step 3: Get user modules
      const { data: userModules } = await supabase.rpc('get_user_modules', {
        p_user_id: session.user.id
      });

      // Step 4: Check approval and active status before granting access

      if (!profileData.is_approved || !profileData.is_active) {
        console.log('User not approved or not active - signing out');
        await supabase.auth.signOut();
        setRealUser(null);
        setRealProfile(null);
        setRealModules([]);
        setRealCapabilities([]);
        clearImpersonation();
        setLoading(false);
        return;
      }

      // Step 4a: Get user capabilities (derived from role via rls_capabilities)
      const { data: userCaps } = await supabase
        .from('rls_capabilities')
        .select('capability')
        .eq('role', profileData.role)
        .limit(5000);

      // Step 5: Update real user state (only for approved & active users)
      setRealUser({
        id: session.user.id,
        email: session.user.email || '',
        role: profileData.role
      });
      setRealProfile({
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        name: profileData.name,
        is_approved: profileData.is_approved,
        is_active: profileData.is_active
      });
      setRealModules(userModules || []);
      setRealCapabilities((userCaps || []).map(c => c.capability));
      setLoading(false);

      console.log('Auth complete');

    } catch (error) {
      console.error('Auth error:', error);
      setRealUser(null);
      setRealProfile(null);
      setRealModules([]);
      setRealCapabilities([]);
      clearImpersonation();
      setLoading(false);
    }
  };

  // Restore impersonation from sessionStorage after auth loads
  useEffect(() => {
    if (!loading && realUser?.role === 'super_admin') {
      const storedId = sessionStorage.getItem(IMPERSONATION_KEY);
      if (storedId && !isImpersonating) {
        startImpersonation(storedId);
      }
    }
    // Only run when loading transitions to false and realUser is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, realUser?.id]);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_OUT') {
        console.log('Signed out');
        setRealUser(null);
        setRealProfile(null);
        setRealModules([]);
        setRealCapabilities([]);
        clearImpersonation();
        setLoading(false);
      } else if (event === 'SIGNED_IN') {
        console.log('Signed in - refreshing auth');
        checkAuth();
      }
      // TOKEN_REFRESHED, USER_UPDATED, etc - ignore
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAuth = async () => {
    await checkAuth();
  };

  // Compute effective values: impersonated when active, real otherwise
  const effectiveCapabilities = isImpersonating ? impersonatedCapabilities : realCapabilities;

  const contextValue: AuthContextType = {
    user: isImpersonating ? impersonatedUser : realUser,
    profile: isImpersonating ? impersonatedProfile : realProfile,
    modules: isImpersonating ? impersonatedModules : realModules,
    capabilities: effectiveCapabilities,
    hasCapability: (capability: string) => effectiveCapabilities.includes(capability),
    loading,
    refreshAuth,
    isImpersonating,
    realUser,
    realProfile,
    startImpersonation,
    stopImpersonation,
    impersonationLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(requiredRoles?: string[]) {
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Handle role-based redirects
  useEffect(() => {
    // Skip role redirects when impersonating — super admin is just viewing
    if (context.isImpersonating) return;

    if (!context.loading && context.user) {
      // Check if user has required role
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(context.user.role)) {
          console.log('User does not have required role - redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    } else if (!context.loading && !context.user) {
      // Only redirect to login if we require roles and we're not already on login
      if (requiredRoles && window.location.pathname !== '/login') {
        navigate('/login');
      }
    }
  }, [context.loading, context.user, context.isImpersonating, requiredRoles, navigate]);

  return context;
}
