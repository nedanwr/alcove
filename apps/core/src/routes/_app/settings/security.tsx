// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { PasswordForm } from "~/components/settings/password-form";
import { SettingsPageHeader } from "~/components/settings/settings-layout";

export const Route = createFileRoute("/_app/settings/security")({
  component: SecuritySettings,
});

function SecuritySettings() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  return (
    <>
      <SettingsPageHeader title="Sign-in & security" description="The password you sign in with." />
      <PasswordForm user={user} onChanged={() => router.invalidate()} />
    </>
  );
}
