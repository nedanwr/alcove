// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";

/**
 * A compact set of mutually exclusive options. It's a radio group, so the arrow keys move between
 * options and select them, and assistive technology announces which option is selected.
 */
function SegmentedControl<Value>({ className, ...props }: RadioGroup.Props<Value>) {
  return (
    <RadioGroup
      data-slot="segmented-control"
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 rounded-lg bg-accent p-0.5",
        className,
      )}
      {...props}
    />
  );
}

function SegmentedControlItem<Value>({ className, ...props }: Radio.Root.Props<Value>) {
  return (
    <Radio.Root
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex h-7 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground outline-none select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring motion-safe:transition-[color,background-color,box-shadow] data-checked:bg-card data-checked:text-foreground data-checked:shadow-xs data-checked:ring-1 data-checked:ring-border data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:text-muted-foreground data-disabled:data-checked:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
