// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { SidebarProvider } from "@alcove/ui/components/ui/sidebar";
import { TooltipProvider } from "@alcove/ui/components/ui/tooltip";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";

import { DriveSidebar } from "~/components/drive/drive-sidebar";

afterEach(cleanup);

async function renderSidebar() {
  const rootRoute = createRootRoute({
    component: () => (
      <TooltipProvider>
        <SidebarProvider>
          <DriveSidebar />
          <Outlet />
        </SidebarProvider>
      </TooltipProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/drive" }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/drive"] }),
  });
  await router.load();
  const { container } = render(<RouterProvider router={router} />);

  return { container, nav: within(screen.getByRole("navigation", { name: "Drive" })) };
}

describe("DriveSidebar", () => {
  it("is titled Drive", async () => {
    const { container } = await renderSidebar();

    expect(container.querySelector("[data-slot=sidebar-title]")?.textContent).toBe("Drive");
  });

  it("links My Files to Drive, as the current page", async () => {
    const { nav } = await renderSidebar();

    const links = nav.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["My Files", "/drive"],
    ]);
    expect(links[0]?.getAttribute("aria-current")).toBe("page");
  });

  it("always lists Drive's other destinations, as unavailable rather than links until they're implemented", async () => {
    const { nav } = await renderSidebar();

    const unavailable = nav.getAllByRole("button");
    expect(unavailable.map((item) => item.textContent)).toEqual([
      "Recent",
      "Shared with me",
      "Favorites",
      "Trash",
    ]);
    for (const item of unavailable) expect(item.hasAttribute("disabled")).toBe(true);
  });

  it("leaves Settings to the rail", async () => {
    const { nav } = await renderSidebar();

    expect(nav.queryByText("Settings")).toBeNull();
  });
});
