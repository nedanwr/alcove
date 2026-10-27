// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { getAccountSessions } from "~/auth/sessions.functions";
import { PasswordForm } from "~/components/settings/password-form";
import { SessionsSection } from "~/components/settings/sessions-section";
import { SettingsPageHeader } from "~/components/settings/settings-section";

export const Route = createFileRoute("/_app/settings/security")({
  loader: () => getAccountSessions(),
  component: SecuritySettings,
});

function SecuritySettings() {
  const { user } = Route.useRouteContext();
  const sessions = Route.useLoaderData();
  const router = useRouter();
  const refresh = () => router.invalidate();

  return (
    <>
      <SettingsPageHeader
        title="Security"
        description="Your password, and where you’re signed in."
      />
      <PasswordForm user={user} onChanged={refresh} />
      <SessionsSection sessions={sessions} onChanged={refresh} />
    </>
  );
}
