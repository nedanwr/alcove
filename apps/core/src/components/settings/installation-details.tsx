// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { DateTime } from "~/components/settings/date-time";
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
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr] sm:gap-y-3">
        {details.map(({ term, description }) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="mb-2 min-w-0 truncate sm:mb-0">{description}</dd>
          </div>
        ))}
      </dl>
    </SettingsSection>
  );
}
