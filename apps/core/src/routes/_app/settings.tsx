// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SettingsLayout } from "~/components/settings/settings-layout";
import { SettingsSidebar } from "~/components/settings/settings-sidebar";

export const Route = createFileRoute("/_app/settings")({
  staticData: { title: "Settings", sidebar: <SettingsRouteSidebar /> },
  component: Settings,
});

function SettingsRouteSidebar() {
  const { user } = Route.useRouteContext();

  return <SettingsSidebar administrator={user.administrator} />;
}

function Settings() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}
