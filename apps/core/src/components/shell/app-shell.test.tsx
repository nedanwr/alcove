// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { TooltipProvider } from "@alcove/ui/components/ui/tooltip";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppShell } from "~/components/shell/app-shell";
import { ThemeProvider } from "~/components/theme-provider";

const user = {
  id: "user-1",
  name: "Ada Lovelace",
  username: "ada",
  email: "ada@example.com",
  image: null,
  administrator: true,
};

// Mirrors the app's destinations, plus nested routes the app doesn't have yet.
function createTestRouter(url: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider>
        <TooltipProvider>
          <AppShell user={user} installationName="Alcove">
            <Outlet />
          </AppShell>
        </TooltipProvider>
      </ThemeProvider>
    ),
  });
  const driveRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "drive",
    staticData: { title: "Drive" },
  });
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "settings",
    staticData: { title: "Settings" },
  });

  return createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        staticData: { title: "Dashboard" },
      }),
      driveRoute.addChildren([
        createRoute({ getParentRoute: () => driveRoute, path: "$folderId" }),
      ]),
      settingsRoute.addChildren([
        createRoute({
          getParentRoute: () => settingsRoute,
          path: "profile",
          staticData: { title: "Profile" },
        }),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
}

afterEach(cleanup);

async function renderShell(url: string) {
  const router = createTestRouter(url);
  await router.load();
  const { container } = render(<RouterProvider router={router} />);

  // The rail and bottom navigation both render; CSS picks one by screen width.
  const linksIn = (slot: string) =>
    Array.from(container.querySelectorAll(`[data-slot=${slot}] a`), (link) => ({
      href: link.getAttribute("href"),
      name: link.getAttribute("aria-label") ?? link.textContent,
      highlighted: link.hasAttribute("data-active"),
      current: link.getAttribute("aria-current") === "page",
    }));

  return {
    title: container.querySelector("h1")?.textContent,
    sidebar: linksIn("sidebar"),
    rail: linksIn("app-rail"),
    bottom: linksIn("app-bottom-navigation"),
  };
}

describe("AppShell navigation", () => {
  it("renders every destination as a link in each navigation", async () => {
    const { sidebar, rail, bottom } = await renderShell("/");

    expect(sidebar.map((link) => link.href)).toEqual(["/", "/", "/drive", "/settings"]);
    expect(rail.map((link) => [link.href, link.name])).toEqual([
      ["/", "Dashboard"],
      ["/drive", "Drive"],
      ["/settings", "Settings"],
    ]);
    expect(bottom.map((link) => [link.href, link.name])).toEqual([
      ["/", "Dashboard"],
      ["/drive", "Drive"],
      ["/settings", "Settings"],
    ]);
  });

  it("labels the navigation landmarks", async () => {
    await renderShell("/");

    expect(
      Array.from(document.querySelectorAll("nav"), (nav) => nav.getAttribute("aria-label")),
    ).toEqual(["Primary", "Primary"]);
  });

  it.each([
    ["/", "/"],
    ["/?view=recent", "/"],
    ["/drive", "/drive"],
    ["/drive/folder-1", "/drive"],
    ["/drive/folder-1?sort=name", "/drive"],
    ["/settings", "/settings"],
    ["/settings/profile", "/settings"],
  ])("on %s, highlights only %s and marks it as the current page", async (url, destination) => {
    const { sidebar, rail, bottom } = await renderShell(url);

    for (const links of [rail, bottom]) {
      expect(links.filter((link) => link.highlighted || link.current)).toEqual([
        expect.objectContaining({ href: destination, highlighted: true, current: true }),
      ]);
    }
    expect(sidebar.filter((link) => link.highlighted)).toEqual([
      expect.objectContaining({ href: destination, current: true }),
    ]);
  });

  it.each([
    ["/", "Dashboard"],
    ["/drive", "Drive"],
    ["/drive/folder-1", "Drive"],
    ["/settings/profile", "Profile"],
  ])("on %s, titles the header %s", async (url, title) => {
    expect((await renderShell(url)).title).toBe(title);
  });
});
