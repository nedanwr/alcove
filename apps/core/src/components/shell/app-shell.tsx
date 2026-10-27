// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { SidebarInset, SidebarProvider } from "@alcove/ui/components/ui/sidebar";
import type { ReactNode } from "react";

import type { SessionUser } from "~/auth/auth-state";
import { AppHeader } from "~/components/shell/app-header";
import { AppBottomNavigation, AppRail } from "~/components/shell/app-rail";
import { AppSidebar } from "~/components/shell/app-sidebar";
import { moduleNavItems } from "~/components/shell/navigation";

export function AppShell({
  user,
  installationName,
  children,
}: {
  user: SessionUser;
  installationName: string;
  children: ReactNode;
}) {
  return (
    <SidebarProvider className="[--sidebar-offset:var(--rail-width)]">
      <AppRail modules={moduleNavItems} />
      <AppSidebar installationName={installationName} />
      <SidebarInset className="min-w-0">
        <AppHeader user={user} />
        {/* The shell imposes no padding or width so each page or module owns its own layout. */}
        <div className="flex min-w-0 flex-1 flex-col pb-(--bottom-navigation-height) sm:pb-0">
          {children}
        </div>
      </SidebarInset>
      <AppBottomNavigation modules={moduleNavItems} />
    </SidebarProvider>
  );
}
