// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { SidebarTrigger, useSidebar } from "@alcove/ui/components/ui/sidebar";
import { cn } from "@alcove/ui/lib/utils";
import { useMatchRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import type { SessionUser } from "~/auth/auth-state";
import { searchSettings } from "~/components/settings/settings-navigation";
import { GlobalSearch } from "~/components/shell/global-search";
import { ModuleIcon } from "~/components/shell/module-icon";
import {
  homeNavItem,
  settingsNavItem,
  type ModuleIdentity,
  type NavItem,
} from "~/components/shell/navigation";
import { Notifications } from "~/components/shell/notifications";
import { UserMenu } from "~/components/shell/user-menu";

type Overlay = "search" | "notifications";

export function AppHeader({
  user,
  sidebar,
  modules,
}: {
  user: SessionUser;
  sidebar: boolean;
  modules: readonly NavItem[];
}) {
  const { state } = useSidebar();
  const current = useCurrentDestination(modules);
  // Search results and notifications never show together: opening one closes the other.
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const overlayChange = (target: Overlay) => (open: boolean) =>
    setOverlay((value) => (open ? target : value === target ? null : value));
  const search = useCallback(
    (query: string) => searchSettings(query, user.administrator),
    [user.administrator],
  );

  return (
    // As tall as the sidebar's header, so the two line up. It sits on the shell's background, above
    // the content panel, and is closer to a docked sidebar (from `md` up) than to the rail.
    <header
      data-slot="app-header"
      className={cn("flex h-[52px] shrink-0 items-center gap-2 px-3", sidebar && "md:pl-2")}
    >
      {/* Opens the sidebar's drawer; from `md` up, the sidebar's own header holds its trigger. */}
      {sidebar ? <SidebarTrigger className="-ml-2 md:hidden" /> : null}
      {current ? (
        // An expanded sidebar's header already names the module, from `md` up.
        <CurrentModule
          module={current}
          className={cn(sidebar && state === "expanded" && "md:hidden")}
        />
      ) : null}
      <GlobalSearch
        search={search}
        open={overlay === "search"}
        onOpenChange={overlayChange("search")}
      />
      <div aria-hidden className="flex-1" />
      <Notifications
        notifications={[]}
        open={overlay === "notifications"}
        onOpenChange={overlayChange("notifications")}
      />
      <UserMenu user={user} />
    </header>
  );
}

/** Home, the installed module, or Settings, whichever holds the current page. */
function useCurrentDestination(modules: readonly NavItem[]) {
  const matchRoute = useMatchRoute();
  return [homeNavItem, ...modules, settingsNavItem].find((item) =>
    matchRoute({ to: item.to, fuzzy: item.exact !== true, includeSearch: false }),
  );
}

function CurrentModule({ module, className }: { module: ModuleIdentity; className: string }) {
  return (
    <div
      data-slot="app-header-module"
      className={cn("mr-1.5 flex max-w-[30%] min-w-0 shrink-0 items-center gap-2", className)}
    >
      <ModuleIcon icon={module.icon} tint={module.tint} variant="label" />
      {/* Narrow, only the tile shows; the name stays for screen readers. */}
      <span className="truncate text-[14px] font-semibold max-[760px]:sr-only">{module.title}</span>
    </div>
  );
}
