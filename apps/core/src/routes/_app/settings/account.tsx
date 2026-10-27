// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { ProfileForm } from "~/components/settings/profile-form";
import { SettingsPageHeader } from "~/components/settings/settings-layout";
import { SignInDetailsForm } from "~/components/settings/sign-in-details-form";

export const Route = createFileRoute("/_app/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  // Reloads the auth state, so the shell and these forms show the saved details.
  const refresh = () => router.invalidate();

  return (
    <>
      <SettingsPageHeader title="Profile" description="How you appear to other people on Alcove" />
      <ProfileForm name={user.name} onSaved={refresh} />
      <SignInDetailsForm username={user.username ?? ""} email={user.email} onSaved={refresh} />
    </>
  );
}
