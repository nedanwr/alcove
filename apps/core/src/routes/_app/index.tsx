// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";

export const Route = createFileRoute("/_app/")({
  staticData: { title: "Dashboard" },
  component: Dashboard,
});

function Dashboard() {
  return (
    <PagePlaceholder title="Welcome to Alcove" description="Alcove Core is under development." />
  );
}
