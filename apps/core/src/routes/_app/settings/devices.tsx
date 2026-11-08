// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { getAccountSessions } from "~/auth/sessions.functions";
import { SessionsSection } from "~/components/settings/sessions-section";
import { SettingsPageHeader } from "~/components/settings/settings-layout";

export const Route = createFileRoute("/_app/settings/devices")({
  loader: () => getAccountSessions(),
  component: DevicesSettings,
});

function DevicesSettings() {
  const sessions = Route.useLoaderData();
  const router = useRouter();

  return (
    <>
      <SettingsPageHeader
        title="Devices & sessions"
        description="The browsers and devices where you’re signed in."
      />
      <SessionsSection sessions={sessions} onChanged={() => router.invalidate()} />
    </>
  );
}
