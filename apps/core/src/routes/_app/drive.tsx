// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";

// Placeholder only. Drive is an independently deployed module and is not part of Core.
export const Route = createFileRoute("/_app/drive")({
  staticData: { title: "Drive" },
  component: Drive,
});

function Drive() {
  return (
    <PagePlaceholder
      title="Drive is not available yet"
      description="Drive will appear here once the module is installed."
    />
  );
}
