// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

import * as React from "react";
import { cn } from "cn";

function Textarea({ className, rows = 3, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        "flex field-sizing-content min-h-[84px] w-full resize-y rounded-[7px] border border-input bg-card px-2.5 py-2 text-base leading-normal text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/28 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20 dark:focus-visible:ring-ring/35 dark:aria-invalid:focus-visible:ring-destructive/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 md:text-[13px]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
