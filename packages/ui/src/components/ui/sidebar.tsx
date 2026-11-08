// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { useIsMobile } from "#ui/hooks/use-mobile";
import { Button } from "#ui/components/ui/button";
import { Input } from "#ui/components/ui/input";
import { Separator } from "#ui/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "#ui/components/ui/sheet";
import { Skeleton } from "#ui/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "#ui/components/ui/tooltip";
import { PanelLeftIcon } from "lucide-react";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "248px";
const SIDEBAR_WIDTH_MOBILE = "min(288px, 86vw)";
const SIDEBAR_WIDTH_ICON = "60px";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

// Matches the application rail's tooltips.
const sidebarTooltipProps = {
  side: "right",
  sideOffset: 10,
  arrow: false,
  className: "max-w-none px-2 py-1 whitespace-nowrap motion-reduce:animate-none",
} satisfies React.ComponentProps<typeof TooltipContent>;

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

/**
 * The sidebar beside the application rail. Its content is composed from the `Sidebar*` parts below,
 * and any other content can sit among them. Below `md`, it becomes a drawer that `SidebarTrigger`
 * opens, and following a link inside it closes it.
 */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  label = "Sidebar",
  accent,
  className,
  style,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  /** Accessible name of the drawer on small screens, such as the module's name. */
  label?: string;
  /** The module's accent colour, for the header icon and the active item. Defaults to the primary colour. */
  accent?: string;
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  // The active item's colours derive from `--sidebar-primary` on this element (see `globals.css`).
  const accentStyle =
    accent === undefined ? undefined : ({ "--sidebar-primary": accent } as React.CSSProperties);

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        style={{ ...accentStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    // Choosing a destination dismisses the drawer, whichever part of the content links to it.
    const closeOnNavigation = (event: React.MouseEvent) => {
      const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
      if (!modified && event.target instanceof Element && event.target.closest("a[href]")) {
        setOpenMobile(false);
      }
    };

    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          showCloseButton={false}
          className="gap-0 bg-sidebar p-0 text-sidebar-foreground motion-reduce:transition-none data-[side=left]:w-(--sidebar-width) data-[side=left]:sm:max-w-none data-[side=right]:w-(--sidebar-width) data-[side=right]:sm:max-w-none"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              ...accentStyle,
              ...style,
            } as React.CSSProperties
          }
          side={side}
          onClick={closeOnNavigation}
        >
          <SheetTitle className="sr-only">{label}</SheetTitle>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
      style={accentStyle}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-180 ease-[ease] motion-reduce:transition-none",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          // `--sidebar-offset` moves a left sidebar along, to make room for anything fixed before it.
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-180 ease-[ease] motion-reduce:transition-none data-[side=left]:left-(--sidebar-offset,0px) data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-offset,0px)-var(--sidebar-width))] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:-right-(--sidebar-width) md:flex",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          className,
        )}
        style={style}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Collapses or expands the sidebar, or opens and closes its drawer on small screens. */
function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, isMobile, open, openMobile } = useSidebar();
  const label = isMobile
    ? openMobile
      ? "Close sidebar"
      : "Open sidebar"
    : open
      ? "Collapse sidebar"
      : "Expand sidebar";

  return (
    // Tooltips never show on mobile; skipping them keeps Escape free to close the drawer.
    <Tooltip disabled={isMobile}>
      <TooltipTrigger
        render={
          <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            aria-label={label}
            className={cn(className)}
            onClick={(event) => {
              onClick?.(event);
              toggleSidebar();
            }}
            {...props}
          />
        }
      >
        <PanelLeftIcon className="size-4.5" />
      </TooltipTrigger>
      <TooltipContent {...sidebarTooltipProps}>{label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:inset-s-1/2 after:w-0.5 hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  );
}

/**
 * The sidebar's top bar, usually a `SidebarHeaderIcon`, a `SidebarTitle`, and a `SidebarTrigger`.
 * Collapsed, only the trigger shows.
 */
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex h-13 shrink-0 items-center gap-2 px-3 group-data-[collapsible=icon]:justify-center",
        className,
      )}
      {...props}
    />
  );
}

/** The module's icon tile, filled with the sidebar's accent colour. */
function SidebarHeaderIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="sidebar-header-icon"
      data-sidebar="header-icon"
      className={cn(
        "flex size-6.5 shrink-0 items-center justify-center rounded-[7px] bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:stroke-2 [&_svg:not([class*='size-'])]:size-3.75",
        className,
      )}
      {...props}
    />
  );
}

/** The module's name, beside its icon. */
function SidebarTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-title"
      data-sidebar="title"
      className={cn(
        "min-w-0 flex-1 truncate text-[14px] font-semibold group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex shrink-0 flex-col gap-px px-2.5 py-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto px-2.5 pt-0.5 pb-3 group-data-[collapsible=icon]:overflow-x-hidden",
        className,
      )}
      {...props}
    />
  );
}

/** A section of the sidebar. Collapsed, its `SidebarGroupLabel` gives way to spacing. */
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col group-data-[collapsible=icon]:has-data-[slot=sidebar-group-label]:pt-3.5",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          // Visually hidden rather than removed when collapsed, so the section keeps its name.
          "flex shrink-0 items-center px-2.5 pt-4 pb-1.5 text-[11.5px] leading-4 font-semibold tracking-[0.02em] text-sidebar-muted-foreground group-data-[collapsible=icon]:sr-only [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  });
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  });
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-px", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  [
    "peer/menu-button group/menu-button relative flex w-full items-center gap-2.5 overflow-hidden rounded-[7px] px-2.5 text-left text-sidebar-muted-foreground outline-none select-none group-has-data-[sidebar=menu-action]/menu-item:pr-8 motion-safe:transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // The active item keeps its tint on hover; its icon, not its label, takes the accent colour.
    "data-active:bg-sidebar-active data-active:font-semibold data-active:text-sidebar-foreground data-active:hover:bg-sidebar-active data-active:hover:text-sidebar-foreground data-active:[&>svg]:text-sidebar-active-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:[stroke-width:1.75] [&_svg:not([class*='size-'])]:size-[17px]",
    // The label is any span that isn't another sidebar part, such as a badge.
    "[&>span:not([data-slot])]:min-w-0 [&>span:not([data-slot])]:flex-1 [&>span:not([data-slot])]:truncate",
    // Collapsed, the icon is centred and the label stays as the accessible name.
    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span:not([data-slot])]:sr-only",
  ],
  {
    variants: {
      variant: {
        default: "",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-8 text-[13.5px]",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props,
    ),
    // Tooltips never show on mobile; skipping them keeps Escape free to close the drawer.
    render: !tooltip || isMobile ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  });

  if (!tooltip || isMobile) {
    return comp;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      {comp}
      <TooltipContent {...sidebarTooltipProps} hidden={state !== "collapsed"} {...tooltip} />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  });
}

/**
 * A count or status at the end of a `SidebarMenuButton`, inside it so it's part of the item's
 * accessible name. Collapsed, it becomes a dot on the icon.
 */
function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11.5px] font-medium text-sidebar-muted-foreground tabular-nums select-none group-data-active/menu-button:text-sidebar-foreground",
        "group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1.5 group-data-[collapsible=icon]:right-2 group-data-[collapsible=icon]:size-1.5 group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:bg-sidebar-primary group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-transparent",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  });
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderIcon,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTitle,
  SidebarTrigger,
  useSidebar,
};
