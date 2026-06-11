# Auth Patterns — Code Standards

**Status**: 🟢 Production · **Last Updated**: 2026-04-26 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

How to write auth-touching code today. Anti-patterns and the bugs they caused are in [lessons.md](./lessons.md).

## Route protection — `ProtectedRoute`

All protected routes wrap their element with [`<ProtectedRoute>`](../../../src/components/auth/ProtectedRoute.tsx). It does the auth + module gate; pages don't repeat that work.

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Auth only — any logged-in user
{ path: '/dashboard',
  element: <ProtectedRoute><Dashboard /></ProtectedRoute> }

// Auth + module gate
{ path: '/quotations',
  element: <ProtectedRoute modulePath="/quotations"><QuotationListPage /></ProtectedRoute> }

// Child routes inherit the parent's module
{ path: '/quotations/:id',
  element: <ProtectedRoute modulePath="/quotations"><QuotationDetail /></ProtectedRoute> }

// Public
{ path: '/login', element: <Login /> }
```

The page itself stays clean — no auth checks:

```tsx
const QuotationListPage = () => (
  <DashboardHeader title="Quotations" description="...">
    <QuotationList />
  </DashboardHeader>
);
```

## Reading auth state — `useAuth()`

```tsx
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, profile, modules } = useAuth();
  // ProtectedRoute already guarantees user/profile are non-null in protected pages.
  return <span>Welcome, {profile?.name}</span>;
};
```

Shape:

```ts
interface AuthContextType {
  user:    { id, email, role } | null;
  profile: { id, name, email, role, is_approved, is_active } | null;
  modules: Array<{ module_id, name, description, icon_name, path, category, sort_order }>;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}
```

## Login implementation

```tsx
const Login = () => {
  const navigate = useNavigate();
  const { loading: authLoading, user } = useAuth();

  // Wait for AuthContext, THEN navigate. Never navigate inline after signIn.
  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [authLoading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Please verify your email before logging in.');
      }

      const { data: profile, error: profileError } = await supabase.rpc('get_user_profile');
      if (profileError) throw new Error('Failed to load user profile.');

      if (!profile.is_approved) {
        await supabase.auth.signOut();
        throw new Error('Your account is pending administrator approval.');
      }
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated.');
      }

      showSuccess(`Welcome back, ${profile.name}!`);
      // Do NOT navigate here — useEffect above does it once AuthContext finishes.
    } catch (err: any) {
      showError(mapError(err));
    }
  };
};
```

Login is the **only** place email/approval/active are validated. AuthContext does not re-check.

## Module-based access

```tsx
// ✅ component-level gate (rare — usually ProtectedRoute is enough)
const hasAccess = modules.some(m => m.path === '/quotations');

// ❌ never compare role strings
if (['management', 'super_admin'].includes(user.role)) { ... }
```

## Clearing auth storage

```ts
import { clearAuthStorage, clearAuthState } from '@/utils/authStorage';

// On logout
const handleLogout = async () => {
  await supabase.auth.signOut();
  clearAuthStorage();          // removes only sb-*-auth-token keys
  navigate('/login');
};

// On Login page mount (defensive — clears stale cookies too)
useEffect(() => { clearAuthState(); }, []);
```

Never `localStorage.clear()` or `sessionStorage.clear()` — they wipe React Query cache and user preferences.

## Error handling — `Login.tsx` mapping

```ts
function mapError(err: any) {
  if (err.message === 'Failed to fetch')         return 'Cannot connect to server. Check your internet connection.';
  if (err.message === 'Invalid login credentials') return 'Invalid email or password.';
  if (err.message?.includes('Email not confirmed')) return 'Please verify your email first.';
  if (err.message?.includes('not approved'))     return 'Your account is pending approval.';
  if (err.message?.includes('not active'))       return 'Your account has been deactivated.';
  return err.message ?? 'An error occurred. Please try again.';
}
```

User-friendly text → `showError`. Full error → `console.error`.

## Mutation error handling — always `finally`

Every mutation that flips a loading flag MUST reset it in `finally`:

```ts
const onSubmit = async (data: FormData) => {
  try {
    await createMutation.mutateAsync(data);
    // Non-critical follow-ups: wrap individually so they can't throw upward
    try { await refetchSomething(); } catch (e) { console.warn('non-critical:', e); }
    showSuccess('Saved');
  } catch (err) {
    console.error(err);
    showError('Failed to save. Please try again.');
  } finally {
    setIsLoading(false);   // never leaves the spinner spinning
    setIsEditMode(false);
  }
};
```

Without `finally`, a thrown error in a non-critical step leaves the form stuck "Saving…" forever.

## AuthContext — keep it simple

```ts
const checkAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { clearState(); return; }

    const { data: profile } = await supabase.rpc('get_user_profile');
    if (!profile?.[0]) { await supabase.auth.signOut(); clearState(); return; }

    const { data: modules } = await supabase.rpc('get_user_modules', { p_user_id: session.user.id });

    setUser({ id, email, role });
    setProfile(profile[0]);
    setModules(modules ?? []);
  } catch (err) {
    console.error('Auth error:', err);
    clearState();
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  checkAuth();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') clearState();
    if (event === 'SIGNED_IN')  checkAuth();
    // TOKEN_REFRESHED — do nothing
  });
  return () => subscription.unsubscribe();
}, []);
```

If you find yourself adding a timeout, a recursive-call guard, or a failsafe timer here — stop, read [lessons.md](./lessons.md), and find the actual root cause instead.

## Anti-patterns (one-liners — full context in [lessons.md](./lessons.md))

| ❌ Don't | Why |
|---|---|
| `if (user.role === 'admin')` | Use module check |
| `enabled: !loading && !!user` on React Query | Couples query to auth → empty-state flashes after back button |
| Navigate inside `handleLogin` after `signInWithPassword` | Race with AuthContext SIGNED_IN → stuck on /login |
| `checkAuth()` on `TOKEN_REFRESHED` | Random mid-session logouts |
| `localStorage.clear()` on logout | Nukes React Query cache |
| References to `auth.users(id)` in app schema | Use `public.users(id)` |
| Complex / role-based RLS | Use minimal RLS + module gate |

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) · [AUTH_FLOWS.md](./AUTH_FLOWS.md) · [AUTH_DATABASE.md](./AUTH_DATABASE.md) · [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md) · [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [../MODULE_SYSTEM.md](../MODULE_SYSTEM.md) · [../react-query-cache/CONTEXT.md](../react-query-cache/CONTEXT.md)
