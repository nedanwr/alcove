// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";

/**
 * A choice between colours, as a radio group. The selected swatch shows a check as well as a ring,
 * so the selection doesn't rely on colour alone.
 */
function SwatchGroup<Value>({ className, ...props }: RadioGroup.Props<Value>) {
  return (
    <RadioGroup
      data-slot="swatch-group"
      className={cn("flex flex-wrap items-center gap-2.5 p-1", className)}
      {...props}
    />
  );
}

/** One colour in a `SwatchGroup`. `label` names the colour for assistive technology. */
function Swatch<Value>({
  color,
  label,
  className,
  ...props
}: Omit<Radio.Root.Props<Value>, "color" | "children"> & { color: string; label: string }) {
  return (
    <Radio.Root
      data-slot="swatch"
      aria-label={label}
      style={{ color }}
      className={cn(
        "flex size-[26px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-current outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring data-checked:ring-2 data-checked:ring-current data-checked:ring-offset-2 data-checked:ring-offset-card data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Radio.Indicator render={<CheckIcon aria-hidden className="size-3.5 text-white" />} />
    </Radio.Root>
  );
}

export { Swatch, SwatchGroup };
