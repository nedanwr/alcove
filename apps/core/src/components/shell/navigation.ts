// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { HardDriveIcon, LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react";

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

const coreNavItems: readonly NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboardIcon, exact: true },
];

const footerNavItems: readonly NavItem[] = [
  { title: "Settings", to: "/settings", icon: SettingsIcon },
];

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

// Placeholder entries. Installed modules will contribute these at runtime.
const moduleNavItems: readonly NavItem[] = [{ title: "Drive", to: "/drive", icon: HardDriveIcon }];

export const navigation = createNavigation(moduleNavItems);
