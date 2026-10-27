// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SettingsLayout } from "~/components/settings/settings-layout";

export const Route = createFileRoute("/_app/settings")({
  staticData: { title: "Settings" },
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();

  return (
    <SettingsLayout administrator={user.administrator}>
      <Outlet />
    </SettingsLayout>
  );
}
