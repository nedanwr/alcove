// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarHeaderIcon,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTitle,
  SidebarTrigger,
} from "@alcove/ui/components/ui/sidebar";
import {
  ClockIcon,
  FilesIcon,
  FolderIcon,
  StarIcon,
  Trash2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { SidebarMenuLink } from "~/components/shell/sidebar-menu-link";
import type { FileRouteTypes } from "~/routeTree.gen";

interface DriveNavItem {
  title: string;
  icon: LucideIcon;
  /** The destination's route. Until Drive implements it, the item shows as unavailable. */
  to?: FileRouteTypes["to"];
}

// Drive's built-in destinations, always listed. Implementing one only means giving it its `to`.
const driveNavItems: readonly DriveNavItem[] = [
  { title: "My Files", icon: FilesIcon, to: "/drive" },
  { title: "Recent", icon: ClockIcon },
  { title: "Shared with me", icon: UsersIcon },
  { title: "Favorites", icon: StarIcon },
  { title: "Trash", icon: Trash2Icon },
];

/**
 * Drive's sidebar and its navigation. It belongs to Drive, and lives in Core only until module
 * integration lets the Drive module (`modules/drive`) provide it. Moving it only means replacing
 * its two Core imports, `SidebarMenuLink` and the route types, with the module's own.
 */
export function DriveSidebar() {
  return (
    <Sidebar collapsible="icon" label="Drive">
      <SidebarHeader>
        <SidebarHeaderIcon>
          <FolderIcon />
        </SidebarHeaderIcon>
        <SidebarTitle>Drive</SidebarTitle>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Drive">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {driveNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.to ? (
                      <SidebarMenuLink
                        to={item.to}
                        activeOptions={{ includeSearch: false }}
                        tooltip={item.title}
                      >
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </SidebarMenuLink>
                    ) : (
                      // Not a link, so it's never presented as a working destination.
                      <SidebarMenuButton type="button" disabled>
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
