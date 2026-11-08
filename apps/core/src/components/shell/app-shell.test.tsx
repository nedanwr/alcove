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

// Stand-ins for the sidebars the Drive and Settings routes provide.
const sidebarFor = (title: string) => (
  <div data-slot="sidebar">
    <a href={`/${title.toLowerCase()}`}>{title}</a>
  </div>
);

// Mirrors the app's destinations, plus nested routes the app doesn't have yet.
function createTestRouter(url: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider>
        <TooltipProvider>
          <AppShell user={user}>
            <Outlet />
          </AppShell>
        </TooltipProvider>
      </ThemeProvider>
    ),
  });
  const driveRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "drive",
    staticData: { title: "Drive", sidebar: sidebarFor("Drive") },
  });
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "settings",
    staticData: { title: "Settings", sidebar: sidebarFor("Settings") },
  });

  return createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        staticData: { title: "Home" },
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
    sidebar: linksIn("sidebar").map((link) => link.name),
    drawerTrigger: container.querySelector("header [data-slot=sidebar-trigger]"),
    panel: container.querySelector("main > [data-slot=app-panel]"),
    rail: linksIn("app-rail"),
    bottom: linksIn("app-bottom-navigation"),
  };
}

describe("AppShell navigation", () => {
  it("renders every destination as a link in each navigation", async () => {
    const { rail, bottom } = await renderShell("/");

    expect(rail.map((link) => [link.href, link.name])).toEqual([
      ["/", "Home"],
      ["/drive", "Drive"],
      ["/settings", "Settings"],
    ]);
    expect(bottom.map((link) => [link.href, link.name])).toEqual([
      ["/", "Home"],
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
    const { rail, bottom } = await renderShell(url);

    for (const links of [rail, bottom]) {
      expect(links.filter((link) => link.highlighted || link.current)).toEqual([
        expect.objectContaining({ href: destination, highlighted: true, current: true }),
      ]);
    }
  });
});

describe("AppShell sidebar", () => {
  it("gives Home no sidebar, and no button to open one", async () => {
    const { sidebar, drawerTrigger } = await renderShell("/");

    expect(sidebar).toEqual([]);
    expect(drawerTrigger).toBeNull();
  });

  it.each([
    ["/drive", "Drive"],
    ["/drive/folder-1", "Drive"],
    ["/settings", "Settings"],
    ["/settings/profile", "Settings"],
  ])("on %s, shows the %s sidebar the route provides", async (url, owner) => {
    const { sidebar, drawerTrigger } = await renderShell(url);

    expect(sidebar).toEqual([owner]);
    expect(drawerTrigger).not.toBeNull();
  });
});

describe("AppShell content panel", () => {
  it.each(["/", "/drive", "/settings/profile"])(
    "on %s, renders the page in the shell's content panel",
    async (url) => {
      const { panel } = await renderShell(url);

      expect(panel).not.toBeNull();
    },
  );
});
