// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cn } from "@alcove/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

const variants = {
  // Beside the module's name in the application header.
  label:
    "size-5.5 rounded-[6px] bg-(--tint) text-white [&_svg]:size-[13px] [&_svg]:[stroke-width:2.1]",
  // A search result: the tint mixed into the popup's surface, behind an icon in the tint itself.
  // Dark surfaces lighten the icon, as the sidebar does for its accent, to keep its contrast.
  result:
    "size-7 rounded-[7px] bg-[color-mix(in_oklab,var(--tint)_13%,var(--color-popover))] text-(--tint) dark:text-[color-mix(in_oklab,var(--tint)_55%,#ffffff)] [&_svg]:size-3.75 [&_svg]:[stroke-width:1.9]",
  notification:
    "size-7.5 rounded-[8px] bg-(--tint) text-white [&_svg]:size-3.75 [&_svg]:[stroke-width:2]",
} as const;

/** A module's icon on a tile in its colour. Decorative: the module's name is always nearby. */
export function ModuleIcon({
  icon: Icon,
  tint,
  variant,
  className,
}: {
  icon: LucideIcon;
  tint: string;
  variant: keyof typeof variants;
  className?: string;
}) {
  const style: CSSProperties & Record<`--${string}`, string> = { "--tint": tint };

  return (
    <span
      aria-hidden
      data-slot="module-icon"
      className={cn(
        "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
        variants[variant],
        className,
      )}
      style={style}
    >
      <Icon />
    </span>
  );
}
