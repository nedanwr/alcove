// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  LaptopIcon,
  PaletteIcon,
  ServerIcon,
  ShieldIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

import type { SearchResultGroup } from "~/components/shell/search";
import { settingsNavItem } from "~/components/shell/navigation";
import type { FileRouteTypes } from "~/routeTree.gen";

export interface SettingsNavItem {
  title: string;
  to: FileRouteTypes["to"];
  icon: LucideIcon;
  /** Other words people search for to find the page. */
  keywords: readonly string[];
}

export interface SettingsNavGroup {
  label: string;
  items: readonly SettingsNavItem[];
}

const accountGroup: SettingsNavGroup = {
  label: "Your account",
  items: [
    {
      title: "Profile",
      to: "/settings/account",
      icon: UserIcon,
      keywords: ["account", "name", "email", "username"],
    },
    {
      title: "Sign-in & security",
      to: "/settings/security",
      icon: ShieldIcon,
      keywords: ["password", "login"],
    },
    {
      title: "Devices & sessions",
      to: "/settings/devices",
      icon: LaptopIcon,
      keywords: ["browsers", "sign out"],
    },
    {
      title: "Appearance",
      to: "/settings/appearance",
      icon: PaletteIcon,
      keywords: ["theme", "dark mode", "light mode"],
    },
  ],
};

const instanceGroup: SettingsNavGroup = {
  label: "Instance administration",
  items: [
    {
      title: "General",
      to: "/settings/instance",
      icon: ServerIcon,
      keywords: ["installation", "instance", "server", "version"],
    },
  ],
};

/**
 * The settings pages someone can open. Leaving out instance administration is only a convenience:
 * its route and server functions check the role themselves.
 */
export function settingsNavGroups(administrator: boolean): readonly SettingsNavGroup[] {
  return administrator ? [accountGroup, instanceGroup] : [accountGroup];
}

/** Finds the settings pages whose name, or a word associated with it, contains the query. */
export function searchSettings(query: string, administrator: boolean): SearchResultGroup[] {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === "") return [];

  const items = settingsNavGroups(administrator).flatMap((group) =>
    group.items
      .filter((item) =>
        [item.title, ...item.keywords].some((text) => text.toLocaleLowerCase().includes(needle)),
      )
      .map((item) => ({
        id: item.to,
        title: item.title,
        location: `${settingsNavItem.title} · ${group.label}`,
        to: item.to,
        icon: item.icon,
      })),
  );

  return items.length > 0 ? [{ source: settingsNavItem, items }] : [];
}
