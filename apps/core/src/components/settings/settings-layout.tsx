// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from "react";

/** The settings pages' content column. The settings sidebar lists the pages. */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="flex max-w-2xl min-w-0 flex-col gap-6">{children}</div>
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
