// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { buttonVariants } from "@alcove/ui/components/ui/button";
import { cn } from "@alcove/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ServerIcon, ShieldIcon, UserIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
  label: "This instance",
  items: [{ title: "General", to: "/settings/instance", icon: ServerIcon }],
};

export function SettingsLayout({
  administrator,
  children,
}: {
  administrator: boolean;
  children: ReactNode;
}) {
  const groups = administrator ? [accountGroup, instanceGroup] : [accountGroup];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:flex-row md:gap-10 md:p-6">
      <nav aria-label="Settings" className="flex shrink-0 flex-col gap-4 md:w-48">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <h2 className="px-3 text-xs font-medium text-muted-foreground">{group.label}</h2>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
                  >
                    <item.icon aria-hidden />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex max-w-2xl min-w-0 flex-1 flex-col gap-6">{children}</div>
    </div>
  );
}

export function SettingsPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
