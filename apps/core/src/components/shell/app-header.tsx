// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { SidebarTrigger } from "@alcove/ui/components/ui/sidebar";
import { cn } from "@alcove/ui/lib/utils";

import type { SessionUser } from "~/auth/auth-state";
import { ModeToggle } from "~/components/mode-toggle";
import { UserMenu } from "~/components/shell/user-menu";

export function AppHeader({ user, sidebar }: { user: SessionUser; sidebar: boolean }) {
  return (
    // As tall as the sidebar's header, so the two line up. It sits on the shell's background, above
    // the content panel, and is closer to a docked sidebar (from `md` up) than to the rail.
    <header className={cn("flex h-[52px] shrink-0 items-center gap-2 px-3", sidebar && "md:pl-2")}>
      {/* Opens the sidebar's drawer; from `md` up, the sidebar's own header holds its trigger. */}
      {sidebar ? <SidebarTrigger className="-ml-2 md:hidden" /> : null}
      {/* Global actions such as search and notifications go before the account menu. */}
      <div className="ml-auto flex items-center gap-1">
        <ModeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
