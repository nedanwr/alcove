// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import { PencilIcon } from "lucide-react";

/**
 * `ghost` reads as plain text until hovered or focused, when it shows the default input's border
 * and ring. Its border stays in place, transparent, so focusing doesn't shift the layout.
 * `editIcon` adds a pencil that hints the text is editable; it hides while the input has focus.
 */
function Input({
  className,
  type,
  size = "default",
  variant = "default",
  editIcon = false,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & {
  size?: "default" | "lg";
  variant?: "default" | "ghost";
  editIcon?: boolean;
}) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      data-variant={variant}
      className={cn(
        "h-[34px] w-full min-w-0 rounded-[7px] border border-input bg-card px-2.5 py-1 text-base text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/28 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20 dark:focus-visible:ring-ring/35 dark:aria-invalid:focus-visible:ring-destructive/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 md:text-[13px] data-[size=lg]:h-10 data-[size=lg]:rounded-md data-[size=lg]:px-3 md:data-[size=lg]:text-sm",
        variant === "ghost" &&
          "cursor-text border-transparent bg-transparent hover:not-focus-visible:bg-accent focus-visible:bg-card disabled:bg-transparent motion-reduce:transition-none",
        editIcon && "peer pr-8",
        className,
      )}
      {...props}
    />
  );

  if (!editIcon) return input;
  return (
    <span data-slot="input-container" className="relative block w-full min-w-0">
      {input}
      <PencilIcon
        aria-hidden
        data-slot="input-edit-icon"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60 peer-hover:text-subtle-foreground peer-focus-visible:hidden peer-disabled:hidden"
      />
    </span>
  );
}

export { Input };
