// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { SessionUser } from "~/auth/auth-state";
import { PasswordSection } from "~/components/settings/password-section";
import { AccountScope, SettingsPageHeader } from "~/components/settings/settings-layout";
import { SignInAlertsSection } from "~/components/settings/sign-in-alerts-section";
import { TwoFactorSection } from "~/components/settings/two-factor-section";

export function SecuritySettings({
  user,
  onChanged,
}: {
  user: SessionUser;
  onChanged: () => Promise<void>;
}) {
  return (
    <>
      <SettingsPageHeader
        title="Sign-in & security"
        description="Manage your password and sign-in security."
      >
        <AccountScope />
      </SettingsPageHeader>
      <PasswordSection user={user} onChanged={onChanged} />
      <TwoFactorSection />
      <SignInAlertsSection />
    </>
  );
}
