// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from "react";

import { SettingsChanges, UnsavedChangesGuard } from "~/components/settings/settings-changes";

/**
 * The settings pages' content column, and the page's save ribbon. The ribbon is the outer column's
 * last child, so it sticks to the bottom of the content panel and centres within it rather than
 * within the narrower settings column. Render one layout per page (keyed by its path), so each page
 * has its own ribbon.
 */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <SettingsChanges>
        {/* Leaves room below the last section for the ribbon, which wraps onto two lines when narrow. */}
        <div className="flex max-w-2xl min-w-0 flex-col gap-6 pb-[calc(var(--save-ribbon-clearance)+(--spacing(10)))] sm:pb-(--save-ribbon-clearance)">
          {children}
        </div>
        <UnsavedChangesGuard />
      </SettingsChanges>
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
