// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { LinkProps } from "@tanstack/react-router";
import { HardDriveIcon, LayoutDashboardIcon, SettingsIcon, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
  /** Only treat the item as active on an exact path match. */
  exact?: boolean;
}

export const coreNavItems: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboardIcon, exact: true },
];

// Placeholder entries. Installed modules will contribute these at runtime.
export const moduleNavItems: NavItem[] = [{ title: "Drive", to: "/drive", icon: HardDriveIcon }];

export const footerNavItems: NavItem[] = [
  { title: "Settings", to: "/settings", icon: SettingsIcon },
];
