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

import { SettingsSidebar } from "~/components/settings/settings-sidebar";

afterEach(cleanup);

async function renderSidebar(url: string, administrator: boolean) {
  const rootRoute = createRootRoute({
    component: () => (
      <TooltipProvider>
        <SidebarProvider>
          <SettingsSidebar administrator={administrator} />
          <Outlet />
        </SidebarProvider>
      </TooltipProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren(
      [
        "/settings/account",
        "/settings/security",
        "/settings/devices",
        "/settings/appearance",
        "/settings/instance",
      ].map((path) => createRoute({ getParentRoute: () => rootRoute, path })),
    ),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);

  return within(screen.getByRole("navigation", { name: "Settings" }));
}

const sections = (nav: ReturnType<typeof within>) =>
  nav.getAllByRole("heading").map((heading: HTMLElement) => heading.textContent);

describe("SettingsSidebar", () => {
  it("shows instance administration to the administrator", async () => {
    const nav = await renderSidebar("/settings/account", true);

    expect(sections(nav)).toEqual(["Your account", "Instance administration"]);
    expect(
      nav.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Profile", "/settings/account"],
      ["Sign-in & security", "/settings/security"],
      ["Devices & sessions", "/settings/devices"],
      ["Appearance", "/settings/appearance"],
      ["General", "/settings/instance"],
    ]);
  });

  it("leaves instance administration out for everyone else", async () => {
    const nav = await renderSidebar("/settings/account", false);

    expect(sections(nav)).toEqual(["Your account"]);
    expect(nav.queryByRole("link", { name: "General" })).toBeNull();
  });

  it.each([
    ["/settings/account", "Profile"],
    ["/settings/security", "Sign-in & security"],
    ["/settings/devices", "Devices & sessions"],
    ["/settings/appearance", "Appearance"],
    ["/settings/instance", "General"],
  ])("on %s, marks only %s as the current page", async (url, name) => {
    const nav = await renderSidebar(url, true);

    const current = nav.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"));
    expect(current.map((link) => [link.textContent, link.getAttribute("aria-current")])).toEqual([
      [name, "page"],
    ]);
    expect(current[0]?.hasAttribute("data-active")).toBe(true);
  });
});
