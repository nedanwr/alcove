// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { badgeVariants } from "@alcove/ui/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@alcove/ui/components/ui/tooltip";
import { cn } from "@alcove/ui/lib/utils";
import { UserIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SettingsChanges, UnsavedChangesGuard } from "~/components/settings/settings-changes";

/**
 * Every settings page's scroll area, content column, and save ribbon. The scroll area is the
 * `settings` container, so the column responds to the width the content panel actually has (which
 * the sidebar changes without the viewport resizing). The ribbon is the scroll area's last child,
 * so it sticks to the bottom of the panel and centres within it rather than within the column.
 * Render one layout per page (keyed by its path), so each page has its own ribbon.
 */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="settings-scroll-area"
      className="@container/settings relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
    >
      <SettingsChanges>
        {/* The bottom padding lets the last setting scroll above the ribbon. */}
        <div
          data-slot="settings-column"
          className="mx-auto flex w-full max-w-220 min-w-0 flex-col gap-7 px-8 pt-7 pb-28 settings-narrow:px-4 settings-narrow:pt-5"
        >
          {children}
        </div>
        <UnsavedChangesGuard />
      </SettingsChanges>
    </div>
  );
}

/** The page's title and description, with `children`, such as `AccountScope`, beside them. */
export function SettingsPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h2>
        <p className="max-w-[62ch] text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Marks a page's settings as the signed-in account's own, unlike instance settings. */
export function AccountScope() {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(badgeVariants({ variant: "outline" }), "text-muted-foreground")}
      >
        <UserIcon aria-hidden data-icon="inline-start" />
        Only you
        <span className="sr-only">: these settings belong to your account.</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        These settings belong to your account. Nobody else can change them.
      </TooltipContent>
    </Tooltip>
  );
}
