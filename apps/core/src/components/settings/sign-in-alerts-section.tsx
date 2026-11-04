// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Switch } from "@alcove/ui/components/ui/switch";
import { useId } from "react";

import { SettingsRow } from "~/components/settings/settings-row";
import { SettingsSection } from "~/components/settings/settings-section";

const alerts = [
  "Email me when a new device signs in",
  "Email me after repeated failed sign-ins",
] as const;

/**
 * Previews sign-in alerts, which need outbound email Alcove doesn't have yet. The switches stay off
 * and disabled, and nothing is saved, so the save ribbon never sees them.
 */
export function SignInAlertsSection() {
  return (
    <SettingsSection
      title="Sign-in alerts"
      description="Not available yet. Alcove doesn’t send email yet, so these alerts can’t be turned on."
    >
      {alerts.map((label) => (
        <SignInAlert key={label} label={label} />
      ))}
    </SettingsSection>
  );
}

function SignInAlert({ label }: { label: string }) {
  const labelId = useId();

  return (
    <SettingsRow>
      <div>
        <span id={labelId}>{label}</span>
      </div>
      <Switch aria-labelledby={labelId} checked={false} disabled />
    </SettingsRow>
  );
}
