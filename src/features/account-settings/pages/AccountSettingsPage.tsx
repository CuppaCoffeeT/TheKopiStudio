/**
 * AccountSettingsPage — self profile & security (SETTINGS archetype).
 *
 * AppHeaderShell + TabNav (NOT StatusTabs — settings pages use TabNav).
 * Profile tab: read-only facts + name/phone form. Security tab: email change
 * (confirmation flow) + password change via supabase.auth.updateUser.
 * Sign-out mirrors AppHeaderShell's flow (AuthContext exposes no signOut):
 * supabase.auth.signOut + clearAuthStorage + navigate /login.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/primitives/shell/Card';
import { Button } from '@/components/primitives/shell/Button';
import { TabNav, type TabNavItem } from '@/components/primitives/detail/TabNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showSuccess, showError } from '@/utils/toastHelper';
import { ProfileTab } from '../components/ProfileTab';
import { SecurityEmailForm } from '../components/SecurityEmailForm';
import { SecurityPasswordForm } from '../components/SecurityPasswordForm';
import type { AccountSettingsTab } from '../types';

const TABS: TabNavItem[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
];

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<AccountSettingsTab>('profile');
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const currentEmail = profile?.email || user?.email || '';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) showError('There was an issue signing out. Clearing session anyway.');
      clearAuthStorage();
      showSuccess('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      showError('An unexpected error occurred during logout');
      setSigningOut(false);
    }
  };

  return (
    <AppHeaderShell
      title="Account Settings"
      description="Your profile and security."
      testId="account-settings-page"
    >
      <div className="flex flex-col gap-6 max-w-3xl">
        <Card padding="p-0">
          <TabNav
            tabs={TABS}
            value={activeTab}
            onChange={(next) => setActiveTab(next as AccountSettingsTab)}
          />
          <CardContent className="p-5">
            {activeTab === 'profile' ? (
              <ProfileTab />
            ) : (
              <div className="flex flex-col gap-8" data-testid="account-security-tab">
                <SecurityEmailForm currentEmail={currentEmail} />
                <div className="border-t border-zinc-100 dark:border-zinc-900 pt-6">
                  <SecurityPasswordForm />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="account-session-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle as="h3">Session</CardTitle>
              <CardDescription>Sign out of your account on this device.</CardDescription>
            </div>
            <Button
              size="lg"
              variant="outline"
              leadingIcon={<LogOut className="w-4 h-4" aria-hidden="true" />}
              onClick={handleSignOut}
              loading={signingOut}
              data-testid="account-signout-btn"
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </AppHeaderShell>
  );
}
