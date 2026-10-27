// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { TooltipProvider } from "@alcove/ui/components/ui/tooltip";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { BoxIcon } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";

import { AppBottomNavigation, AppRail } from "~/components/shell/app-rail";
import type { NavItem } from "~/components/shell/navigation";

afterEach(cleanup);

// Stand-ins for installed modules, at paths the app's route types accept.
const paths = [
  "/drive",
  "/setup",
  "/sign-in",
  "/settings/account",
  "/settings/instance",
  "/settings/security",
  "/settings",
] as const;
const modules: NavItem[] = paths.map((to, index) => ({
  title: `Module ${index + 1}`,
  to,
  icon: BoxIcon,
}));

// Overflow beyond the rail's six modules, to fill the tile grid.
const tileModules: NavItem[] = (
  ["/settings/account", "/settings/instance", "/settings/security", "/setup", "/sign-in"] as const
).map((to, index) => ({ title: `Tile ${index + 1}`, to, icon: BoxIcon }));

async function renderNavigation(url: string, items: readonly NavItem[]) {
  const rootRoute = createRootRoute({
    component: () => (
      <TooltipProvider>
        <AppRail modules={items} />
        <AppBottomNavigation modules={items} />
        <Outlet />
      </TooltipProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren(
      ["/", ...paths].map((path) => createRoute({ getParentRoute: () => rootRoute, path })),
    ),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await router.load();
  const { container } = render(<RouterProvider router={router} />);

  const region = (slot: string) => {
    const element = container.querySelector<HTMLElement>(`[data-slot=${slot}]`);
    if (!element) throw new Error(`Missing ${slot}`);
    return within(element);
  };

  return { rail: region("app-rail"), bottom: region("app-bottom-navigation") };
}

const moduleLinkNames = (links: HTMLElement[]) =>
  links
    .map((link) => link.getAttribute("aria-label") ?? link.textContent)
    .filter((name) => name.startsWith("Module"));

describe("AppRail", () => {
  it.each([
    ["one module", 1],
    ["no modules", 0],
  ])("always shows home, the divider, and settings, even with %s", async (_, count) => {
    const { rail } = await renderNavigation("/", modules.slice(0, count));

    expect(rail.getAllByRole("link").map((link) => link.getAttribute("aria-label"))).toEqual([
      "Dashboard",
      ...modules.slice(0, count).map((item) => item.title),
      "Settings",
    ]);
    expect(rail.getByRole("separator")).toBeDefined();
  });

  it("shows up to six modules directly, in order", async () => {
    const { rail } = await renderNavigation("/", modules.slice(0, 6));

    expect(moduleLinkNames(rail.getAllByRole("link"))).toHaveLength(6);
    expect(rail.queryByRole("button", { name: "More modules" })).toBeNull();
  });

  it("collects the rest under More, which is active when they hold the current page", async () => {
    const { rail } = await renderNavigation("/settings", modules);

    expect(moduleLinkNames(rail.getAllByRole("link"))).toEqual(
      [1, 2, 3, 4, 5, 6].map((n) => `Module ${n}`),
    );
    const more = rail.getByRole("button", { name: "More modules" });
    expect(more.hasAttribute("data-active")).toBe(true);

    fireEvent.click(more);
    const popover = await screen.findByRole("dialog", { name: "More modules" });
    const tile = within(popover).getByRole("link", { name: "Module 7" });
    expect(tile.getAttribute("aria-current")).toBe("page");

    fireEvent.click(tile);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("leaves More inactive elsewhere", async () => {
    const { rail } = await renderNavigation("/drive", modules);

    expect(rail.getByRole("button", { name: "More modules" }).hasAttribute("data-active")).toBe(
      false,
    );
  });
});

describe("AppBottomNavigation", () => {
  it("shows home, three modules, More, and settings", async () => {
    const { bottom } = await renderNavigation("/", modules.slice(0, 5));

    expect(bottom.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Module 1",
      "Module 2",
      "Module 3",
      "Settings",
    ]);

    fireEvent.click(bottom.getByRole("button", { name: "More modules" }));
    const popover = await screen.findByRole("dialog", { name: "More modules" });
    expect(
      within(popover)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Module 4", "Module 5"]);
  });

  it("leaves out More when every module fits", async () => {
    const { bottom } = await renderNavigation("/", modules.slice(0, 3));

    expect(bottom.queryByRole("button", { name: "More modules" })).toBeNull();
  });
});

async function openTiles() {
  const { rail } = await renderNavigation("/", [...modules.slice(0, 6), ...tileModules]);
  fireEvent.click(rail.getByRole("button", { name: "More modules" }));
  const popover = within(await screen.findByRole("dialog", { name: "More modules" }));
  return (name: string) => popover.getByRole("link", { name });
}

describe("More modules tiles", () => {
  it.each([
    ["ArrowRight", "Tile 1", "Tile 2"],
    ["ArrowLeft", "Tile 2", "Tile 1"],
    ["ArrowDown", "Tile 2", "Tile 5"],
    ["ArrowUp", "Tile 5", "Tile 2"],
    ["Home", "Tile 5", "Tile 1"],
    ["End", "Tile 2", "Tile 5"],
    // There's no tile below the second one, so focus stays put.
    ["ArrowDown", "Tile 3", "Tile 3"],
  ])("moves focus with %s from %s to %s", async (key, from, to) => {
    const tile = await openTiles();
    tile(from).focus();

    fireEvent.keyDown(tile(from), { key });

    expect(document.activeElement).toBe(tile(to));
  });
});
