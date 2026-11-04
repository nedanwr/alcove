// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { SecuritySettings } from "~/components/settings/security-settings";

export const Route = createFileRoute("/_app/settings/security")({
  component: SecuritySettingsRoute,
});

function SecuritySettingsRoute() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  return <SecuritySettings user={user} onChanged={() => router.invalidate()} />;
}
