// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FolderIcon, LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react";

import type { FileRouteTypes } from "~/routeTree.gen";

export interface NavItem {
  title: string;
  /** Absolute path of a registered route. */
  to: FileRouteTypes["to"];
  icon: LucideIcon;
  /** Only treat the item as active on an exact path match, not on nested routes. */
  exact?: boolean;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: readonly NavItem[];
}

export interface Navigation {
  groups: readonly NavGroup[];
  footer: readonly NavItem[];
}

export const homeNavItem: NavItem = {
  title: "Dashboard",
  to: "/",
  icon: LayoutDashboardIcon,
  exact: true,
};

export const settingsNavItem: NavItem = { title: "Settings", to: "/settings", icon: SettingsIcon };

const coreNavItems: readonly NavItem[] = [homeNavItem];

const footerNavItems: readonly NavItem[] = [settingsNavItem];

/**
 * Combines Core's own destinations with those contributed by installed modules. Empty groups are
 * left out, so the "Modules" heading only appears when there is a module to show.
 */
export function createNavigation(moduleNavItems: readonly NavItem[]): Navigation {
  const groups: NavGroup[] = [
    { id: "core", items: coreNavItems },
    { id: "modules", label: "Modules", items: moduleNavItems },
  ];

  return {
    groups: groups.filter((group) => group.items.length > 0),
    footer: footerNavItems,
  };
}

export function splitOverflow<T>(items: readonly T[], limit: number) {
  if (items.length <= limit) return { visible: items, overflow: [] };
  return { visible: items.slice(0, limit), overflow: items.slice(limit) };
}

// Placeholder entries in installation order. Installed modules will contribute these at runtime.
export const moduleNavItems: readonly NavItem[] = [
  { title: "Drive", to: "/drive", icon: FolderIcon },
];

export const navigation = createNavigation(moduleNavItems);
