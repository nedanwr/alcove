// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { requireAdministrator } from "~/auth/auth-state";
import { InstallationDetails } from "~/components/settings/installation-details";
import { InstallationForm } from "~/components/settings/installation-form";
import { SettingsPageHeader } from "~/components/settings/settings-section";
import { getInstallationSettings } from "~/installation.functions";

export const Route = createFileRoute("/_app/settings/instance")({
  beforeLoad: ({ context }) => requireAdministrator(context.user),
  loader: () => getInstallationSettings(),
  component: InstanceSettings,
});

function InstanceSettings() {
  const settings = Route.useLoaderData();
  const router = useRouter();
  const refresh = () => router.invalidate();

  return (
    <>
      <SettingsPageHeader
        title="Instance"
        description="Settings for this Alcove server and everyone who uses it."
      />
      <InstallationForm name={settings.name} onSaved={refresh} />
      <InstallationDetails settings={settings} />
    </>
  );
}
