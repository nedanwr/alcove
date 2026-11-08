// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute } from "@tanstack/react-router";

import { AppearanceSettings } from "~/components/settings/appearance-settings";

export const Route = createFileRoute("/_app/settings/appearance")({
  component: AppearanceSettings,
});
