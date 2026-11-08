// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@alcove/ui/components/ui/popover";
import { Separator } from "@alcove/ui/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@alcove/ui/components/ui/tooltip";
import { cn } from "@alcove/ui/lib/utils";
import { createLink, useMatchRoute } from "@tanstack/react-router";
import { EllipsisIcon } from "lucide-react";
import {
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { AlcoveMark } from "~/components/alcove-mark";
import {
  homeNavItem,
  settingsNavItem,
  splitOverflow,
  type NavItem,
} from "~/components/shell/navigation";

const RAIL_MODULE_LIMIT = 6;
const BOTTOM_NAVIGATION_MODULE_LIMIT = 3;
const TILE_COLUMNS = 3;

const MORE_LABEL = "More modules";

// A destination is identified by its path alone, so search params never deactivate it.
const activeOptions = (item: NavItem) => ({ exact: item.exact === true, includeSearch: false });

const iconClassName =
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:[stroke-width:1.75] [&_svg:not([class*='size-'])]:size-5";

// The active state uses a surface, an outline, and an indicator bar so it doesn't rely on color alone.
const railItemClassName = cn(
  "relative flex size-10 shrink-0 items-center justify-center rounded-[10px] text-rail-muted-foreground outline-none select-none motion-safe:transition-colors",
  "hover:bg-rail-accent hover:text-rail-foreground data-popup-open:bg-rail-accent data-popup-open:text-rail-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "data-active:bg-rail-active data-active:text-rail-foreground data-active:ring-1 data-active:ring-rail-border",
  "before:absolute before:top-1/2 before:left-[calc((40px-var(--rail-width))/2)] before:hidden before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-rail-indicator data-active:before:block",
  iconClassName,
);

const bottomItemClassName = cn(
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] text-rail-muted-foreground outline-none select-none motion-safe:transition-colors",
  "hover:text-rail-foreground data-popup-open:text-rail-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
  "data-active:font-medium data-active:text-rail-foreground",
  "before:absolute before:top-0 before:left-1/2 before:hidden before:h-[3px] before:w-[18px] before:-translate-x-1/2 before:rounded-b-full before:bg-rail-indicator data-active:before:block",
  "[&>span]:max-w-full [&>span]:truncate",
  iconClassName,
);

const tileClassName = cn(
  "flex min-w-0 flex-col items-center gap-1.5 rounded-[10px] px-1 py-2.5 text-xs text-rail-muted-foreground outline-none motion-safe:transition-colors",
  "hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
  "data-active:bg-selected data-active:font-medium data-active:text-foreground",
  "[&>span]:max-w-full [&>span]:truncate",
  iconClassName,
);

/** Platform navigation beside the module's sidebar; `AppBottomNavigation` replaces it below `sm`. */
export function AppRail({ modules }: { modules: readonly NavItem[] }) {
  const { visible, overflow } = splitOverflow(modules, RAIL_MODULE_LIMIT);

  return (
    <nav
      aria-label="Primary"
      data-slot="app-rail"
      className="sticky top-0 z-20 hidden h-svh w-(--rail-width) shrink-0 flex-col items-center gap-1 self-start bg-rail pt-2.5 pb-3 text-rail-foreground sm:flex"
    >
      <RailLink
        to={homeNavItem.to}
        activeOptions={activeOptions(homeNavItem)}
        label={homeNavItem.title}
      >
        <AlcoveMark className="size-5.5" />
      </RailLink>
      <Separator className="my-1 bg-rail-divider data-horizontal:w-6" />
      {visible.map((item) => (
        <RailLink key={item.to} to={item.to} activeOptions={activeOptions(item)} label={item.title}>
          <item.icon aria-hidden />
        </RailLink>
      ))}
      {overflow.length > 0 ? <MoreModules modules={overflow} placement="rail" /> : null}
      <div aria-hidden className="flex-1" />
      <RailLink
        to={settingsNavItem.to}
        activeOptions={activeOptions(settingsNavItem)}
        label={settingsNavItem.title}
      >
        <settingsNavItem.icon aria-hidden />
      </RailLink>
    </nav>
  );
}

// The shell pads its content by `--bottom-navigation-height` so this never covers it.
export function AppBottomNavigation({ modules }: { modules: readonly NavItem[] }) {
  const { visible, overflow } = splitOverflow(modules, BOTTOM_NAVIGATION_MODULE_LIMIT);

  return (
    <nav
      aria-label="Primary"
      data-slot="app-bottom-navigation"
      className="fixed inset-x-0 bottom-0 z-20 flex h-(--bottom-navigation-height) items-stretch border-t border-rail-border bg-rail px-1 text-rail-foreground sm:hidden"
    >
      <BottomNavigationLink to={homeNavItem.to} activeOptions={activeOptions(homeNavItem)}>
        <AlcoveMark />
        <span>{homeNavItem.title}</span>
      </BottomNavigationLink>
      {visible.map((item) => (
        <BottomNavigationLink key={item.to} to={item.to} activeOptions={activeOptions(item)}>
          <item.icon aria-hidden />
          <span>{item.title}</span>
        </BottomNavigationLink>
      ))}
      {overflow.length > 0 ? <MoreModules modules={overflow} placement="bottom" /> : null}
      <BottomNavigationLink to={settingsNavItem.to} activeOptions={activeOptions(settingsNavItem)}>
        <settingsNavItem.icon aria-hidden />
        <span>{settingsNavItem.title}</span>
      </BottomNavigationLink>
    </nav>
  );
}

function MoreModules({
  modules,
  placement,
}: {
  modules: readonly NavItem[];
  placement: "rail" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const matchRoute = useMatchRoute();
  // "More" stands in for the current destination when that destination is inside it.
  const active = modules.some((item) =>
    matchRoute({ to: item.to, fuzzy: item.exact !== true, includeSearch: false }),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {placement === "rail" ? (
        // The popover opens where the tooltip would, so the tooltip steps aside while it's open.
        <RailItem label={MORE_LABEL} isActive={active} tooltip={!open} render={<PopoverTrigger />}>
          <EllipsisIcon aria-hidden />
        </RailItem>
      ) : (
        <PopoverTrigger
          aria-label={MORE_LABEL}
          data-active={active || undefined}
          className={bottomItemClassName}
        >
          <EllipsisIcon aria-hidden />
          <span>More</span>
        </PopoverTrigger>
      )}
      <PopoverContent
        className="w-75 max-w-[calc(100vw-1rem)] gap-2 rounded-[12px] p-3 motion-reduce:animate-none"
        {...(placement === "rail"
          ? { side: "right", align: "start", sideOffset: 10 }
          : { side: "top", align: "end", sideOffset: 6 })}
      >
        <PopoverTitle className="px-1 text-xs text-muted-foreground">{MORE_LABEL}</PopoverTitle>
        <div className="grid grid-cols-3 gap-1" onKeyDown={moveTileFocus}>
          {modules.map((item) => (
            <TileLink
              key={item.to}
              to={item.to}
              activeOptions={activeOptions(item)}
              onClick={() => setOpen(false)}
            >
              <item.icon aria-hidden />
              <span>{item.title}</span>
            </TileLink>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const tileKeyOffsets: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -TILE_COLUMNS,
  ArrowDown: TILE_COLUMNS,
};

function nextTileIndex(key: string, index: number, count: number) {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const offset = tileKeyOffsets[key];
  return offset === undefined ? undefined : index + offset;
}

function moveTileFocus(event: KeyboardEvent<HTMLDivElement>) {
  const tiles = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a"));
  const index = tiles.findIndex((tile) => tile === event.target);
  if (index === -1) return;

  const next = nextTileIndex(event.key, index, tiles.length);
  const tile = next === undefined ? undefined : tiles[next];
  if (!tile) return;

  event.preventDefault();
  tile.focus();
}

function RailItem({
  label,
  isActive,
  tooltip = true,
  render,
  children,
}: {
  label: string;
  isActive: boolean;
  tooltip?: boolean;
  render: ReactElement;
  children: ReactNode;
}) {
  return (
    <Tooltip disabled={!tooltip}>
      <TooltipTrigger
        aria-label={label}
        data-active={isActive || undefined}
        className={railItemClassName}
        render={render}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        arrow={false}
        className="max-w-none px-2 py-1 whitespace-nowrap motion-reduce:animate-none"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// The highlight follows the `aria-current` each link sets from `activeOptions`, so the two always agree.

const RailLink = createLink(function RailLink({
  label,
  children,
  ...props
}: ComponentProps<"a"> & { label: string }) {
  return (
    <RailItem label={label} isActive={props["aria-current"] === "page"} render={<a {...props} />}>
      {children}
    </RailItem>
  );
});

const BottomNavigationLink = createLink(function BottomNavigationLink({
  className,
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      data-active={props["aria-current"] === "page" || undefined}
      className={cn(bottomItemClassName, className)}
      {...props}
    />
  );
});

const TileLink = createLink(function TileLink({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      data-active={props["aria-current"] === "page" || undefined}
      className={cn(tileClassName, className)}
      {...props}
    />
  );
});
