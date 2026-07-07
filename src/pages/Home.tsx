import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  PageTitle,
} from '@/components/primitives/shell';
import { getGreeting } from '@/utils/dashboardHelpers';

/**
 * Placeholder authed landing page.
 *
 * Demonstrates the foundation wiring: `useAuth()` for profile + module access,
 * the design-system primitives, and module-driven navigation. Replace with your
 * real dashboard.
 */
export default function Home() {
  const navigate = useNavigate();
  const { profile, modules } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <PageTitle>
            {getGreeting()}
            {profile?.name ? `, ${profile.name}` : ''}
          </PageTitle>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your modules</CardTitle>
            <CardDescription>
              Module access is driven by your role. Press ⌘K to search modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules yet. Seed the <code>modules</code> table and grant them to your
                role (see the foundation migration in <code>supabase/migrations/</code>).
              </p>
            ) : (
              <ul className="space-y-1" data-testid="home-module-grid">
                {modules.map((m) => (
                  <li key={m.path}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate(m.path)}
                      data-testid={`home-module-tile${m.path.replace(/\//g, '-')}`}
                    >
                      {m.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
