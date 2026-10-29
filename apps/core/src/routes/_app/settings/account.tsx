// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { AccountIdentity } from "~/components/settings/account-identity";
import { PersonalDetailsForm } from "~/components/settings/personal-details-form";
import { AccountScope, SettingsPageHeader } from "~/components/settings/settings-layout";
import { VisibilitySection } from "~/components/settings/visibility-section";

export const Route = createFileRoute("/_app/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  // Reloads the auth state, so the shell and the identity summary show the saved details.
  const refresh = () => router.invalidate();

  return (
    <>
      <SettingsPageHeader
        title="Profile"
        description="How you appear to other people on this server."
      >
        <AccountScope />
      </SettingsPageHeader>
      <AccountIdentity user={user} />
      <PersonalDetailsForm
        details={{ name: user.name, email: user.email, username: user.username ?? "" }}
        onSaved={refresh}
      />
      <VisibilitySection />
    </>
  );
}
