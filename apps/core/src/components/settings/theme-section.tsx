// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "@alcove/ui/components/ui/button";
import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";

import { SettingsSection } from "~/components/settings/settings-section";
import { useTheme, type Theme } from "~/components/theme-provider";

const themeOptions: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

/** The theme is saved in this browser, not on the account. */
export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection
      title="Theme"
      description="Choose light or dark, or follow your system’s setting."
    >
      <div role="group" aria-label="Theme" className="flex flex-wrap gap-2">
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            variant={theme === option.value ? "default" : "outline"}
            aria-pressed={theme === option.value}
            onClick={() => setTheme(option.value)}
          >
            <option.icon aria-hidden />
            {option.label}
          </Button>
        ))}
      </div>
    </SettingsSection>
  );
}
