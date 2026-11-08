// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

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
  // A fresh layout per page, so one page's pending or saved changes never show on another.
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <SettingsLayout key={pathname}>
      <Outlet />
    </SettingsLayout>
  );
}
