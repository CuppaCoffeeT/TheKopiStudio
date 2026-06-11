import { useState } from 'react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Card, CardContent } from '@/components/primitives/shell/Card';
import { TabNav, type TabNavItem } from '@/components/primitives/detail/TabNav';
import { Alert } from '@/components/primitives/overlays/Alert';
import type { AccountSettingsTab } from '../types';

/**
 * AccountSettingsPage — self profile & security (SETTINGS archetype).
 *
 * AppHeaderShell + TabNav (NOT StatusTabs — settings pages use TabNav).
 *
 * P1 scaffold stub: real shell + tab structure with honest in-build content.
 * Profile (name/phone via users_update) and Security (email/password via
 * supabase.auth.updateUser) forms land in Phase P5.
 */

const TABS: TabNavItem[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
];

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<AccountSettingsTab>('profile');

  return (
    <AppHeaderShell
      title="Account Settings"
      description="Your profile and security."
      testId="account-settings-page"
    >
      <Card>
        <TabNav
          tabs={TABS}
          value={activeTab}
          onChange={(next) => setActiveTab(next as AccountSettingsTab)}
        />
        <CardContent>
          {activeTab === 'profile' ? (
            <Alert
              variant="info"
              title="Profile settings are being built"
              description="Name and phone editing arrives in this module's next phase. Your details are unchanged in the meantime."
            />
          ) : (
            <Alert
              variant="info"
              title="Security settings are being built"
              description="Email and password changes arrive in this module's next phase."
            />
          )}
        </CardContent>
      </Card>
    </AppHeaderShell>
  );
}
