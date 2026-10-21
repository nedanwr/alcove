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
import { Link, createLink } from "@tanstack/react-router";
import { useRef, useState, type ComponentProps } from "react";

import { navigation, type NavItem } from "~/components/shell/navigation";

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
        {navigation.groups.map((group) => (
          <SidebarGroup key={group.id}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <NavMenu items={group.items} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavMenu items={navigation.footer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavMenu({ items }: { items: readonly NavItem[] }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <NavMenuItem key={item.to} item={item} />
      ))}
    </SidebarMenu>
  );
}

function NavMenuItem({ item }: { item: NavItem }) {
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
      <SidebarMenuLink
        to={item.to}
        // A destination is identified by its path alone, so search params never deactivate it.
        activeOptions={{ exact: item.exact === true, includeSearch: false }}
        tooltip={{ children: item.title, hidden: state !== "collapsed" && !truncated }}
        onPointerEnter={measureLabel}
        onFocus={measureLabel}
        // Dismiss the mobile drawer once a destination is chosen.
        onClick={() => setOpenMobile(false)}
      >
        <item.icon />
        <span ref={labelRef}>{item.title}</span>
      </SidebarMenuLink>
    </SidebarMenuItem>
  );
}

type SidebarMenuLinkProps = ComponentProps<"a"> &
  Required<Pick<ComponentProps<typeof SidebarMenuButton>, "tooltip">>;

// A sidebar menu button rendered as a router link. The link resolves its own active state from
// `activeOptions`, and the highlight follows the `aria-current` it sets, so the two always agree.
const SidebarMenuLink = createLink(function SidebarMenuLink({
  tooltip,
  children,
  ...props
}: SidebarMenuLinkProps) {
  return (
    <SidebarMenuButton
      tooltip={tooltip}
      isActive={props["aria-current"] === "page"}
      render={<a {...props} />}
    >
      {children}
    </SidebarMenuButton>
  );
});
