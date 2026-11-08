// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { cn } from "cn";

import { Input } from "#ui/components/ui/input";

/**
 * A free-text input that suggests items as people type, such as a search field. Unlike a combobox,
 * it never remembers a selection: choosing an item runs its `onClick`, from a click or Enter.
 */
const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteInput({ className, ...props }: AutocompletePrimitive.Input.Props) {
  return (
    <AutocompletePrimitive.Input
      data-slot="autocomplete-input"
      render={<Input className={cn(className)} />}
      {...props}
    />
  );
}

function AutocompleteContent({
  className,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  ...props
}: AutocompletePrimitive.Popup.Props &
  Pick<AutocompletePrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        className="isolate z-60 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-content"
          className={cn(
            "w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-[12px] border border-border bg-popover text-popover-foreground shadow-md duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none",
            className,
          )}
          {...props}
        />
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  );
}

function AutocompleteList({ className, ...props }: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="autocomplete-list"
      className={cn(
        "max-h-[min(440px,var(--available-height))] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 outline-none data-empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteGroup({ className, ...props }: AutocompletePrimitive.Group.Props) {
  return (
    <AutocompletePrimitive.Group
      data-slot="autocomplete-group"
      className={cn("block", className)}
      {...props}
    />
  );
}

function AutocompleteGroupLabel({ className, ...props }: AutocompletePrimitive.GroupLabel.Props) {
  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="autocomplete-group-label"
      className={cn(
        "px-2.25 pt-2 pb-1 text-[11.5px] leading-4 font-semibold text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

// Pointer hover highlights the item too, so `data-highlighted` is also the hover state.
function AutocompleteItem({ className, ...props }: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "flex min-w-0 cursor-default items-center gap-2.5 rounded-[7px] px-2.5 py-1.75 text-[13px] outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders its children only when the list has no items. It always stays mounted, so screen readers
 * announce changes; render the message conditionally rather than hiding this element.
 */
function AutocompleteEmpty({ className, ...props }: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  );
}

const AutocompleteCollection = AutocompletePrimitive.Collection;

export {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
};
