/**
 * ProfileTab — read-only account facts (email / role / member-since / legacy
 * username) + editable name & phone form. Reads via useAccountProfile, writes
 * via useUpdateProfile (mutation lives in hooks/, not here).
 */

import { useEffect, useState } from 'react';
import { Field } from '@/components/primitives/form/Field';
import { Input } from '@/components/primitives/form/Input';
import { Button } from '@/components/primitives/shell/Button';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Alert } from '@/components/primitives/overlays/Alert';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { useAccountProfile } from '../hooks/useAccountProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

const ROLE_TONE: Record<string, BadgeTone> = {
  super_admin: 'accent',
  manager: 'info',
  advisor: 'neutral',
};

const formatRoleName = (role: string) =>
  role
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');

export function ProfileTab() {
  const { data: profile, isLoading, isError, refetch } = useAccountProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div data-testid="account-profile-loading">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <Alert
        variant="error"
        title="Could not load your profile"
        description="Something went wrong fetching your account details."
        primaryAction={{ label: 'Retry', onClick: () => refetch() }}
      />
    );
  }

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0;
  const dirty = trimmedName !== profile.name || phone.trim() !== (profile.phone ?? '');

  const handleSave = () => {
    updateProfile.mutate({
      name: trimmedName,
      phone: phone.trim() === '' ? null : phone.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-6" data-testid="account-profile-tab">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" hint="Change it from the Security tab.">
          <span
            className="text-[14px] text-zinc-900 dark:text-zinc-50 break-all"
            data-testid="account-profile-email"
          >
            {profile.email}
          </span>
        </Field>
        <Field label="Role">
          <span data-testid="account-profile-role-badge">
            <Badge tone={ROLE_TONE[profile.role] ?? 'neutral'}>
              {formatRoleName(profile.role)}
            </Badge>
          </span>
        </Field>
        <Field label="Member since">
          <span
            className="text-[14px] text-zinc-900 dark:text-zinc-50"
            data-testid="account-profile-member-since"
          >
            {profile.createdAt ? formatDisplayDateLong(profile.createdAt) : '—'}
          </span>
        </Field>
        {profile.legacyUsername && (
          <Field label="Legacy username" hint="From the original profiler app — display only.">
            <span
              className="text-[14px] text-zinc-900 dark:text-zinc-50"
              data-testid="account-profile-legacy-username"
            >
              {profile.legacyUsername}
            </span>
          </Field>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-900 pt-5 flex flex-col gap-4">
        <Field label="Name" required error={nameValid ? undefined : 'Name is required.'}>
          <Input
            size="lg"
            value={name}
            error={!nameValid}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            aria-label="Name"
            data-testid="account-profile-name-input"
          />
        </Field>
        <Field label="Phone" hint="Optional — used for contact only.">
          <Input
            size="lg"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +65 9123 4567"
            aria-label="Phone"
            data-testid="account-profile-phone-input"
          />
        </Field>
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={!dirty || !nameValid}
            loading={updateProfile.isPending}
            data-testid="account-profile-save-btn"
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
