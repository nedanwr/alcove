// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FolderIcon, LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react";

import type { FileRouteTypes } from "~/routeTree.gen";

/** How the shell identifies a module, or Core's Home and Settings: in its header, search, and notifications. */
export interface ModuleIdentity {
  title: string;
  icon: LucideIcon;
  /** The module's colour, behind its icon on tiles. White icons must keep their contrast against it. */
  tint: string;
}

export interface NavItem extends ModuleIdentity {
  /** Absolute path of a registered route. */
  to: FileRouteTypes["to"];
  /** Only treat the item as active on an exact path match, not on nested routes. */
  exact?: boolean;
}

export const homeNavItem: NavItem = {
  title: "Home",
  to: "/",
  icon: LayoutDashboardIcon,
  tint: "#27272a",
  exact: true,
};

export const settingsNavItem: NavItem = {
  title: "Settings",
  to: "/settings",
  icon: SettingsIcon,
  tint: "#52525b",
};

export function splitOverflow<T>(items: readonly T[], limit: number) {
  if (items.length <= limit) return { visible: items, overflow: [] };
  return { visible: items.slice(0, limit), overflow: items.slice(limit) };
}

// Placeholder entries in installation order. Installed modules will contribute these at runtime.
export const moduleNavItems: readonly NavItem[] = [
  { title: "Drive", to: "/drive", icon: FolderIcon, tint: "#3b6fd8" },
];
