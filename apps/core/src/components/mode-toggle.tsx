// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@alcove/ui/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { MonitorIcon, MoonIcon, PaletteIcon, SettingsIcon, SunIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useTheme } from "~/components/theme-provider";
import type { Theme } from "~/components/theme-provider";

const themeOptions: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "Match device", icon: MonitorIcon },
];

/**
 * The theme switcher, as an "Appearance" submenu of another dropdown menu, with a link to the
 * Appearance settings page.
 */
export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <PaletteIcon aria-hidden />
        Appearance
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-36 motion-reduce:animate-none">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value: Theme) => setTheme(value)}>
            {themeOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
                <option.icon />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/settings/appearance" />}>
          <SettingsIcon aria-hidden />
          Appearance settings
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
