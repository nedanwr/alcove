// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Card, CardContent } from "@alcove/ui/components/ui/card";
import type { ReactNode } from "react";

import { AlcoveMark } from "~/components/alcove-mark";

/** The page around sign-in and setup: Alcove's brand, the server's host, and Core's version. */
export function AuthLayout({ host, children }: { host: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-7.5 items-center justify-center rounded-lg bg-foreground text-background">
            <AlcoveMark className="size-4.5" />
          </span>
          <span className="font-semibold tracking-tight">Alcove</span>
        </div>
        <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">
          <span className="sr-only">Server: </span>
          {host}
        </p>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-115">{children}</div>
      </main>
      <footer className="px-4 pt-4 pb-5 text-center text-xs text-muted-foreground">
        {`Alcove Core ${ALCOVE_CORE_VERSION}`}
      </footer>
    </div>
  );
}

/** A sign-in or setup page: its heading, a card holding the form, and an optional closing note. */
export function AuthPanel({
  title,
  description,
  note,
  children,
}: {
  title: string;
  description: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Card variant="raised">
        <CardContent>{children}</CardContent>
      </Card>
      {note ? <p className="text-center text-sm text-muted-foreground">{note}</p> : null}
    </div>
  );
}
