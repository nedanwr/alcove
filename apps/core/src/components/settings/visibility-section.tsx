// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldDescription } from "@alcove/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@alcove/ui/components/ui/select";
import { useId } from "react";

import { SettingsSection } from "~/components/settings/settings-section";
import { SettingsRow } from "~/components/settings/settings-row";

const preferences = [
  {
    label: "Who can find you",
    description: "Who can find you when searching for people.",
    options: ["Everyone on this server", "Only people in my groups", "Only administrators"],
  },
  {
    label: "Who can see your email",
    description: "Who can see your email on your profile.",
    options: ["Everyone on this server", "People I share with", "Administrators only"],
  },
];

/**
 * Previews visibility preferences that Alcove can't enforce yet. Their options are shown but can't
 * be chosen, and nothing is saved, so the save ribbon never sees them.
 */
export function VisibilitySection() {
  return (
    <SettingsSection
      title="Visibility"
      description="Not available yet. Alcove doesn’t have people search or sharing yet, so these preferences can’t be set."
    >
      {preferences.map((preference) => (
        <VisibilityPreference key={preference.label} {...preference} />
      ))}
    </SettingsSection>
  );
}

function VisibilityPreference({
  label,
  description,
  options,
}: {
  label: string;
  description: string;
  options: readonly string[];
}) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <SettingsRow>
      <div>
        <span id={labelId}>{label}</span>
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      </div>
      <div className="w-60">
        <Select value={null}>
          <SelectTrigger
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            className="w-full"
          >
            <SelectValue placeholder="Not available yet" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option} disabled>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingsRow>
  );
}
