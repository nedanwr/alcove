// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { SidebarMenuButton } from "@alcove/ui/components/ui/sidebar";
import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type SidebarMenuLinkProps = ComponentProps<"a"> &
  Required<Pick<ComponentProps<typeof SidebarMenuButton>, "tooltip">>;

/**
 * A sidebar item rendered as a router link. The link resolves its own active state from
 * `activeOptions`, and the highlight follows the `aria-current` it sets, so the two always agree.
 * The tooltip names the item when the sidebar is collapsed to icons.
 */
export const SidebarMenuLink = createLink(function SidebarMenuLink({
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
