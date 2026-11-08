// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldDescription } from "@alcove/ui/components/ui/field";
import { SegmentedControl, SegmentedControlItem } from "@alcove/ui/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@alcove/ui/components/ui/select";
import { Swatch, SwatchGroup } from "@alcove/ui/components/ui/swatch-group";
import { Switch } from "@alcove/ui/components/ui/switch";
import { useId, type ReactNode } from "react";

import { AccountScope, SettingsPageHeader } from "~/components/settings/settings-layout";
import { SettingsRow } from "~/components/settings/settings-row";
import { SettingsPanel } from "~/components/settings/settings-section";
import { useTheme, type Theme } from "~/components/theme-provider";

const themeOptions: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match device" },
];

const accentOptions = [
  { value: "teal", label: "Teal", color: "#0F766E" },
  { value: "blue", label: "Blue", color: "#3B5BDB" },
  { value: "violet", label: "Violet", color: "#7C3AED" },
  { value: "amber", label: "Amber", color: "#B4531A" },
  { value: "rose", label: "Rose", color: "#BE185D" },
] as const;

const densityOptions = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
] as const;

// Modules will join these once Alcove can list the enabled ones. Home is always available.
const startOptions = [
  { value: "home", label: "Home" },
  { value: "last", label: "Last place I was" },
];

type ControlLabels = { "aria-labelledby": string; "aria-describedby": string | undefined };

/**
 * Appearance preferences. Only the theme works yet, and it's saved in this browser rather than on
 * the account. The other preferences show their intended controls and defaults, but are disabled
 * and save nothing, so the save ribbon never sees them.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const unavailableId = useId();

  return (
    <>
      <SettingsPageHeader title="Appearance" description="Customize how Alcove looks and feels.">
        <AccountScope />
      </SettingsPageHeader>
      <SettingsPanel>
        <PreferenceRow label="Theme">
          {(labels) => (
            <SegmentedControl<Theme> value={theme} onValueChange={setTheme} {...labels}>
              {themeOptions.map((option) => (
                <SegmentedControlItem key={option.value} value={option.value}>
                  {option.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </PreferenceRow>
        <PreferenceRow
          label="Accent colour"
          description="Used for buttons, selections, and focus indicators."
          unavailableId={unavailableId}
        >
          {(labels) => (
            <SwatchGroup value="teal" disabled {...labels}>
              {accentOptions.map((option) => (
                <Swatch
                  key={option.value}
                  value={option.value}
                  color={option.color}
                  label={option.label}
                />
              ))}
            </SwatchGroup>
          )}
        </PreferenceRow>
        <PreferenceRow
          label="Density"
          description="Compact fits more rows in lists and tables."
          unavailableId={unavailableId}
        >
          {(labels) => (
            <SegmentedControl value="comfortable" disabled {...labels}>
              {densityOptions.map((option) => (
                <SegmentedControlItem key={option.value} value={option.value}>
                  {option.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </PreferenceRow>
        <PreferenceRow label="Open to" unavailableId={unavailableId}>
          {(labels) => (
            <div className="w-55 max-w-full">
              <Select value="home" items={startOptions} disabled>
                <SelectTrigger className="w-full" {...labels}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {startOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </PreferenceRow>
        <PreferenceRow
          label="Reduce motion"
          description="Reduce animations and movement throughout Alcove. Also follows your device settings."
          unavailableId={unavailableId}
        >
          {(labels) => <Switch checked={false} disabled {...labels} />}
        </PreferenceRow>
        <p
          id={unavailableId}
          className="border-t border-divider px-4 py-3 text-[12.5px] leading-normal text-muted-foreground"
        >
          <span className="font-medium text-foreground">Coming later:</span> accent colour, density,
          where Alcove opens, and a reduce-motion switch can’t be changed yet. Alcove already
          reduces motion when your device asks it to.
        </p>
      </SettingsPanel>
    </>
  );
}

function PreferenceRow({
  label,
  description,
  unavailableId,
  children,
}: {
  label: string;
  description?: string;
  /** The note explaining why the preference can't be changed yet, if it can't. */
  unavailableId?: string;
  children: (labels: ControlLabels) => ReactNode;
}) {
  const labelId = useId();
  const descriptionId = useId();
  const describedBy = [description ? descriptionId : undefined, unavailableId]
    .filter(Boolean)
    .join(" ");

  return (
    <SettingsRow>
      <div>
        <span id={labelId}>{label}</span>
        {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      </div>
      {children({ "aria-labelledby": labelId, "aria-describedby": describedBy || undefined })}
    </SettingsRow>
  );
}
