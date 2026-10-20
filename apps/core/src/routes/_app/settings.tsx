// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";

export const Route = createFileRoute("/_app/settings")({
  staticData: { title: "Settings" },
  component: Settings,
});

function Settings() {
  return (
    <PagePlaceholder
      title="Settings are coming soon"
      description="Workspace and account settings will live here."
    />
  );
}
