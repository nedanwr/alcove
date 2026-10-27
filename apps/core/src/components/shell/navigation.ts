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

export const homeNavItem: NavItem = {
  title: "Dashboard",
  to: "/",
  icon: LayoutDashboardIcon,
  exact: true,
};

export const settingsNavItem: NavItem = { title: "Settings", to: "/settings", icon: SettingsIcon };

export function splitOverflow<T>(items: readonly T[], limit: number) {
  if (items.length <= limit) return { visible: items, overflow: [] };
  return { visible: items.slice(0, limit), overflow: items.slice(limit) };
}

// Placeholder entries in installation order. Installed modules will contribute these at runtime.
export const moduleNavItems: readonly NavItem[] = [
  { title: "Drive", to: "/drive", icon: FolderIcon },
];
