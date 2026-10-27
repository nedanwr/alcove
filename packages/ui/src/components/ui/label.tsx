// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

import * as React from "react";
import { cn } from "cn";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-[13px] leading-[1.4] font-medium text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A decorative required marker. Hidden from assistive technology: mark the control itself
 * `required` so its semantics are announced.
 */
function LabelRequired({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="label-required"
      // Offsets the label's 8px gap to sit 2px from the text.
      className={cn("-ms-1.5 text-destructive", className)}
      {...props}
    >
      *
    </span>
  );
}

/** Marks an optional field; prefer this when most fields in a form are required. */
function LabelOptional({
  className,
  children = "(optional)",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="label-optional"
      className={cn("-ms-1 font-normal text-muted-foreground", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Label, LabelOptional, LabelRequired };
