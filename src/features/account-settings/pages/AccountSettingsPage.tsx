/**
 * AccountSettingsPage — self profile & security (SETTINGS archetype).
 *
 * AppHeaderShell + TabNav (NOT StatusTabs — settings pages use TabNav).
 * Profile tab: read-only facts + name/phone form. Security tab: email change
 * (confirmation flow) + password change via supabase.auth.updateUser.
 * Sign-out mirrors AppHeaderShell's flow (AuthContext exposes no signOut):
 * supabase.auth.signOut + clearAuthStorage + navigate /login.
 *
 * 2a "Kopi House" (2026-07-25): the direction never mocked a settings screen,
 * so the page is assembled from its documented parts — uppercase kicker over
 * the serif title (AppHeaderShell), cream panels on the page ground, each
 * opening with the uppercase 11px `.12em` panel label, sub-sections split by
 * hairlines rather than nested boxes, and the session facts as label/value
 * rows in the Detail comp's reference-panel form. Recorded in the handoff
 * decisions.md.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Card } from '@/components/primitives/shell/Card';
import { Button } from '@/components/primitives/shell/Button';
import { TabNav, type TabNavItem } from '@/components/primitives/detail/TabNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/utils/authStorage';
import { showSuccess, showError } from '@/utils/toastHelper';
import { cn } from '@/lib/utils';
import { ProfileTab } from '../components/ProfileTab';
import { SecurityEmailForm } from '../components/SecurityEmailForm';
import { SecurityPasswordForm } from '../components/SecurityPasswordForm';
import type { AccountSettingsTab } from '../types';

const TABS: TabNavItem[] = [
  { value: 'profile', label: 'Profile', testId: 'account-settings-tab-profile' },
  { value: 'security', label: 'Security', testId: 'account-settings-tab-security' },
];

/** 2a panel label — uppercase 11px `.12em`, `--fg-muted` (4.72:1 on card cream). */
const PANEL_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground m-0';

function PanelLabel({ children, className }: { children: string; className?: string }) {
  return (
    <h2 className={cn(PANEL_LABEL, className)} style={{ fontFamily: 'var(--font-sans)' }}>
      {children}
    </h2>
  );
}

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
      kicker="Workspace · Account"
      title="Account Settings"
      description="Your profile and security."
      testId="account-settings-page"
    >
      <div className="flex flex-col gap-6 max-w-3xl">
        <Card padding="p-0" className="overflow-hidden">
          <TabNav
            tabs={TABS}
            value={activeTab}
            onChange={(next) => setActiveTab(next as AccountSettingsTab)}
          />
          <div className="p-[22px]">
            {activeTab === 'profile' ? (
              <ProfileTab />
            ) : (
              <div className="flex flex-col gap-6" data-testid="account-security-tab">
                <section className="flex flex-col gap-4">
                  <PanelLabel>Email address</PanelLabel>
                  <SecurityEmailForm currentEmail={currentEmail} />
                </section>
                <section className="flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-6">
                  <PanelLabel>Password</PanelLabel>
                  <SecurityPasswordForm />
                </section>
              </div>
            )}
          </div>
        </Card>

        <Card padding="p-[22px]" data-testid="account-session-card">
          <PanelLabel className="mb-4">Session</PanelLabel>
          {/* 2a reference-panel rows: muted label left, ink value right, the
              gap alone separating them — no hairlines between rows. */}
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground flex-none">Signed in as</span>
              <span className="min-w-0 truncate text-foreground" data-testid="account-session-email">
                {currentEmail || '—'}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
              Sign out of your account on this device.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
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
