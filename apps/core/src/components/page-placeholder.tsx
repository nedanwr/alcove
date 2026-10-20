// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
