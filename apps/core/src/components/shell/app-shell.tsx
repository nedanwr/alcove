// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { SidebarInset, SidebarProvider } from "@alcove/ui/components/ui/sidebar";
import { cn } from "@alcove/ui/lib/utils";
import { useMatches } from "@tanstack/react-router";
import type { ReactNode } from "react";

import type { SessionUser } from "~/auth/auth-state";
import { AppHeader } from "~/components/shell/app-header";
import { AppBottomNavigation, AppRail } from "~/components/shell/app-rail";
import { moduleNavItems } from "~/components/shell/navigation";

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  // The deepest matched route that declares a sidebar owns it. Routes without one, such as Home, give their content the full width beside the rail.
  const routeSidebar = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.sidebar)?.staticData.sidebar,
  });

  return (
    // The shell fills the viewport and the content panel scrolls, so the document itself never does.
    <SidebarProvider className="h-svh [--sidebar-offset:var(--rail-width)]">
      <AppRail modules={moduleNavItems} />
      {routeSidebar}
      {/* Clears the bottom navigation below `sm`, which is fixed over the bottom of the viewport. */}
      <SidebarInset className="min-h-0 min-w-0 bg-sidebar pb-[calc(var(--bottom-navigation-height)+--spacing(2))] sm:pb-2">
        <AppHeader user={user} sidebar={routeSidebar !== undefined} modules={moduleNavItems} />
        {/*
         * The content panel, raised on the shell's background, which matches the sidebar. It meets
         * a docked sidebar (from `md` up, expanded or collapsed) and is inset from the rail, or the
         * screen edge, otherwise. Popups render in portals, so clipping the panel's corners never
         * clips them.
         */}
        <div
          data-slot="app-panel"
          className={cn(
            "mx-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border bg-card text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.03)]",
            routeSidebar !== undefined && "md:ml-0",
          )}
        >
          {/* The shell imposes no padding or width so each page or module owns its own layout. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </SidebarInset>
      <AppBottomNavigation modules={moduleNavItems} />
    </SidebarProvider>
  );
}
