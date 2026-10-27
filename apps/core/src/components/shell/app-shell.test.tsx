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
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

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

async function renderShell(url: string) {
  const router = createTestRouter(url);
  await router.load();
  const html = renderToString(<RouterProvider router={router} />);

  const links = Array.from(html.matchAll(/<a\b[^>]*>/g), ([tag]) => ({
    href: /\shref="([^"]*)"/.exec(tag)?.[1],
    highlighted: /\sdata-active[\s=>]/.test(tag),
    current: tag.includes('aria-current="page"'),
  }));

  return {
    title: /<h1\b[^>]*>(.*?)<\/h1>/.exec(html)?.[1],
    links,
    highlighted: links.filter((link) => link.highlighted),
  };
}

describe("AppShell navigation", () => {
  it("renders every destination as a link", async () => {
    const { links } = await renderShell("/");

    expect(links.map((link) => link.href)).toEqual(["/", "/", "/drive", "/settings"]);
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
    const { highlighted } = await renderShell(url);

    expect(highlighted).toEqual([{ href: destination, highlighted: true, current: true }]);
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
