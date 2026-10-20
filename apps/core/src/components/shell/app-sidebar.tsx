// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@alcove/ui/components/ui/sidebar";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

import {
  coreNavItems,
  footerNavItems,
  moduleNavItems,
  type NavItem,
} from "~/components/shell/navigation";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Alcove" render={<Link to="/" />}>
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground"
              >
                A
              </span>
              <span className="font-semibold">Alcove</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu items={coreNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={moduleNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavMenu items={footerNavItems} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavMenu({ items }: { items: NavItem[] }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <NavMenuItem key={item.to} item={item} />
      ))}
    </SidebarMenu>
  );
}

function NavMenuItem({ item }: { item: NavItem }) {
  const matchRoute = useMatchRoute();
  const { setOpenMobile, state } = useSidebar();
  const labelRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  // Long titles (such as module names) are truncated when expanded, so the tooltip then shows
  // the full title. Measured on hover and focus, just before the tooltip opens.
  const measureLabel = () => {
    const label = labelRef.current;
    setTruncated(label !== null && label.scrollWidth > label.clientWidth);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={{ children: item.title, hidden: state !== "collapsed" && !truncated }}
        isActive={Boolean(matchRoute({ to: item.to, fuzzy: !item.exact }))}
        render={<Link to={item.to} />}
        onPointerEnter={measureLabel}
        onFocus={measureLabel}
        // Dismiss the mobile drawer once a destination is chosen.
        onClick={() => setOpenMobile(false)}
      >
        <item.icon />
        <span ref={labelRef}>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
