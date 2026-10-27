// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute } from "@tanstack/react-router";

import { ThemeSection } from "~/components/settings/theme-section";
import { SettingsPageHeader } from "~/components/settings/settings-layout";

export const Route = createFileRoute("/_app/settings/appearance")({
  component: AppearanceSettings,
});

function AppearanceSettings() {
  return (
    <>
      <SettingsPageHeader title="Appearance" description="How Alcove looks on this device." />
      <ThemeSection />
    </>
  );
}
