// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const cardVariants = cva(
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden border bg-card py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>[data-slot=card-header].border-b]:pt-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=lg]:[--card-spacing:--spacing(5)] sm:data-[size=lg]:[--card-spacing:--spacing(7)] *:[img:first-child]:rounded-t-[inherit] *:[img:last-child]:rounded-b-[inherit]",
  {
    variants: {
      variant: {
        flat: "rounded-[12px]",
        // Standalone on the page background; 20px padding on small screens, 28px from `sm`.
        raised:
          "rounded-xl shadow-elevated [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(7)]",
        // Render as a button, link, or label; `aria-pressed`, `aria-checked`, `aria-selected`, or
        // a checked input inside marks it selected.
        interactive:
          "cursor-pointer gap-2.5 rounded-[12px] text-left transition-colors outline-none [--card-spacing:--spacing(3)] hover:border-border-hover hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring aria-checked:border-ring aria-checked:ring-1 aria-checked:ring-ring aria-checked:ring-inset aria-pressed:border-ring aria-pressed:ring-1 aria-pressed:ring-ring aria-pressed:ring-inset aria-selected:border-ring aria-selected:ring-1 aria-selected:ring-ring aria-selected:ring-inset has-checked:border-ring has-checked:ring-1 has-checked:ring-ring has-checked:ring-inset",
      },
    },
    defaultVariants: {
      variant: "flat",
    },
  },
);

function Card({
  className,
  variant = "flat",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { size?: "default" | "sm" | "lg" }) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">({ className: cn(cardVariants({ variant }), className) }, props),
    render,
    state: { slot: "card", variant, size },
  });
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-x-2 gap-y-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        // A section header: compact, divided from the body, with room for a trailing ghost button.
        "[.border-b]:items-center [.border-b]:border-divider [.border-b]:py-2.5 [.border-b]:pr-2.5 [.border-b]:pl-4",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm leading-[1.4] font-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[13px] leading-normal text-subtle-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-end gap-2 border-t border-divider bg-background px-3 py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
