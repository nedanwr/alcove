// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderIcon,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTitle,
  SidebarTrigger,
} from "@alcove/ui/components/ui/sidebar";
import { ServerIcon, SettingsIcon, ShieldIcon, UserIcon, type LucideIcon } from "lucide-react";

import { SidebarMenuLink } from "~/components/shell/sidebar-menu-link";
import type { FileRouteTypes } from "~/routeTree.gen";

interface SettingsNavItem {
  title: string;
  to: FileRouteTypes["to"];
  icon: LucideIcon;
}

interface SettingsNavGroup {
  label: string;
  items: readonly SettingsNavItem[];
}

const accountGroup: SettingsNavGroup = {
  label: "Your account",
  items: [
    { title: "Account", to: "/settings/account", icon: UserIcon },
    { title: "Security", to: "/settings/security", icon: ShieldIcon },
  ],
};

const instanceGroup: SettingsNavGroup = {
  label: "Instance administration",
  items: [{ title: "General", to: "/settings/instance", icon: ServerIcon }],
};

/**
 * The settings sidebar. Hiding instance administration from everyone else is only a convenience:
 * its route and server functions check the role themselves.
 */
export function SettingsSidebar({ administrator }: { administrator: boolean }) {
  const groups = administrator ? [accountGroup, instanceGroup] : [accountGroup];

  return (
    <Sidebar collapsible="icon" label="Settings">
      <SidebarHeader>
        <SidebarHeaderIcon>
          <SettingsIcon />
        </SidebarHeaderIcon>
        <SidebarTitle>Settings</SidebarTitle>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Settings">
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel render={<h2 />}>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuLink
                        to={item.to}
                        activeOptions={{ includeSearch: false }}
                        tooltip={item.title}
                      >
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
