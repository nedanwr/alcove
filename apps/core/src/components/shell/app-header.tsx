// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Separator } from "@alcove/ui/components/ui/separator";
import { SidebarTrigger } from "@alcove/ui/components/ui/sidebar";
import { useMatches } from "@tanstack/react-router";

import { ModeToggle } from "~/components/mode-toggle";

export function AppHeader() {
  // The deepest matched route that declares a title describes the current page.
  const title = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.title)?.staticData.title,
  });

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1.5" />
      <Separator
        orientation="vertical"
        className="mr-1 data-vertical:h-4 data-vertical:self-auto"
      />
      <h1 className="min-w-0 truncate text-sm font-medium">{title}</h1>
      {/* Reserved for global actions such as search, notifications, and the account menu. */}
      <div className="ml-auto flex items-center gap-1">
        <ModeToggle />
      </div>
    </header>
  );
}
