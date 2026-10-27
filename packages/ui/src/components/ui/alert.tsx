// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";

import { Button } from "#ui/components/ui/button";

// Status variants tint the card surface and border with their `--alert-color`.
const tinted =
  "border-[color-mix(in_srgb,var(--alert-color)_35%,var(--card))] bg-[color-mix(in_srgb,var(--alert-color)_8%,var(--card))] text-(--alert-color) dark:bg-[color-mix(in_srgb,var(--alert-color)_12%,var(--card))]";

const alertVariants = cva(
  "group/alert relative grid w-full rounded-lg border py-3 pr-2.5 pl-3.5 text-left text-[13px] has-data-[slot=alert-action]:pr-[46px] has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-3 *:[svg]:text-current *:[svg]:[stroke-width:1.9] *:[svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: cn(tinted, "[--alert-color:var(--info)]"),
        success: cn(tinted, "[--alert-color:var(--success)]"),
        warning: cn(tinted, "[--alert-color:var(--warning)]"),
        destructive: cn(tinted, "[--alert-color:var(--destructive)]"),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  default: null,
  info: <InfoIcon />,
  success: <CircleCheckIcon />,
  warning: <TriangleAlertIcon />,
  destructive: <CircleAlertIcon />,
};

// Informational messages are announced politely; warnings and errors interrupt.
const variantRoles: Record<AlertVariant, "alert" | "status"> = {
  default: "alert",
  info: "status",
  success: "status",
  warning: "alert",
  destructive: "alert",
};

/**
 * A callout for status messages. Status variants render their icon and ARIA role by default;
 * pass `icon` to replace the icon (or `null` to hide it) and `role` to override the role.
 */
function Alert({
  className,
  variant,
  icon,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    icon?: React.ReactNode;
  }) {
  const resolved = variant ?? "default";

  return (
    <div
      data-slot="alert"
      role={variantRoles[resolved]}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon === undefined ? variantIcons[resolved] : icon}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "text-[13.5px] leading-[1.4] font-semibold group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:decoration-current/50 [&_a]:underline-offset-4 [&_a]:hover:decoration-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-[13px] leading-normal text-balance text-subtle-foreground group-has-[>svg]/alert:col-start-2 md:text-pretty [[data-slot=alert-title]+&]:mt-[3px] [&_a]:underline [&_a]:decoration-current/50 [&_a]:underline-offset-4 [&_a]:hover:text-foreground [&_a]:hover:decoration-2 [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

/** Inline action links below the description, in the alert's color. */
function AlertLinks({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-links"
      className={cn(
        "mt-1.5 flex flex-wrap items-center gap-4 text-[13px] font-semibold group-has-[>svg]/alert:col-start-2 *:rounded-xs *:underline *:decoration-1 *:underline-offset-3 *:outline-none *:hover:decoration-2 *:focus-visible:outline-2 *:focus-visible:outline-offset-2 *:focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2.5", className)}
      {...props}
    />
  );
}

/** A dismiss button placed in the alert's top-right corner. */
function AlertDismiss({
  className,
  children,
  "aria-label": ariaLabel = "Dismiss",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <AlertAction>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={ariaLabel}
        className={cn(
          "rounded-[6px] text-muted-foreground [&_svg:not([class*='size-'])]:size-[15px]",
          className,
        )}
        {...props}
      >
        {children ?? <XIcon />}
      </Button>
    </AlertAction>
  );
}

export { Alert, AlertTitle, AlertDescription, AlertLinks, AlertAction, AlertDismiss };
