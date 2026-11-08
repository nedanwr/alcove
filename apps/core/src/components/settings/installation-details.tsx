// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { DateTime } from "~/components/settings/date-time";
import { SettingsRow } from "~/components/settings/settings-row";
import { SettingsSection } from "~/components/settings/settings-section";
import type { InstallationSettings } from "~/installation";

export function InstallationDetails({ settings }: { settings: InstallationSettings }) {
  const details = [
    { term: "Address", description: <span className="font-mono text-xs">{settings.url}</span> },
    { term: "Alcove Core version", description: settings.version },
    { term: "Set up", description: <DateTime value={settings.initializedAt} dateOnly /> },
  ];

  return (
    <SettingsSection
      title="About this instance"
      description="The address comes from the BETTER_AUTH_URL environment variable."
    >
      <dl>
        {details.map(({ term, description }) => (
          <SettingsRow key={term}>
            <dt>{term}</dt>
            <dd className="truncate">{description}</dd>
          </SettingsRow>
        ))}
      </dl>
    </SettingsSection>
  );
}
