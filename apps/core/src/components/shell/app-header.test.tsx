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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "~/components/shell/app-shell";
import { ThemeProvider } from "~/components/theme-provider";

const signOut = vi.hoisted(() => vi.fn<() => Promise<{ error: { message: string } | null }>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { signOut } }));

const user = {
  id: "user-1",
  name: "Ada Lovelace",
  username: "ada",
  email: "ada@example.com",
  image: null,
  administrator: false,
};

// Stand-ins for the sidebars the Drive and Settings routes provide.
const sidebarFor = (title: string) => <div data-slot="sidebar">{title}</div>;

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
      createRoute({ getParentRoute: () => rootRoute, path: "/" }),
      createRoute({ getParentRoute: () => rootRoute, path: "sign-in" }),
      driveRoute.addChildren([
        createRoute({ getParentRoute: () => driveRoute, path: "$folderId" }),
      ]),
      settingsRoute.addChildren(
        ["account", "security", "devices", "appearance", "instance"].map((path) =>
          createRoute({ getParentRoute: () => settingsRoute, path }),
        ),
      ),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
}

async function renderHeader(url: string) {
  const router = createTestRouter(url);
  await router.load();
  const { container } = render(<RouterProvider router={router} />);
  const header = container.querySelector<HTMLElement>("header[data-slot=app-header]");
  if (!header) throw new Error("Missing the application header");

  return {
    router,
    header: within(header),
    module: () => header.querySelector<HTMLElement>("[data-slot=app-header-module]"),
    trigger: () => header.querySelector<HTMLElement>("[data-slot=sidebar-trigger]"),
    search: within(header).getByRole<HTMLInputElement>("combobox", { name: "Search Alcove" }),
  };
}

// Typing, rather than autofill, which carries no `inputType` and doesn't open the results.
function type(input: HTMLInputElement, value: string) {
  fireEvent.input(input, { target: { value }, inputType: "insertText" });
}

beforeEach(() => {
  signOut.mockReset();
  localStorage.clear();
});

afterEach(cleanup);

describe("AppHeader layout", () => {
  it("holds, in order, the module, search, notifications, and the account menu", async () => {
    const { header } = await renderHeader("/");

    expect(
      header.getAllByRole("button").map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Notifications", "Account: Ada Lovelace"]);
    expect(header.getByRole("combobox", { name: "Search Alcove" })).toBeDefined();
  });

  it.each([
    ["/", "Home"],
    ["/drive", "Drive"],
    ["/drive/folder-1", "Drive"],
    ["/settings/appearance", "Settings"],
  ])("on %s, identifies the current destination as %s", async (url, title) => {
    const { module } = await renderHeader(url);

    expect(module()?.textContent).toBe(title);
  });

  it("names the module on Home at every width, since there's no sidebar to name it", async () => {
    const { module, trigger } = await renderHeader("/");

    expect(module()?.className).not.toContain("md:hidden");
    expect(trigger()).toBeNull();
  });

  it("only shows the module's icon tile on narrow screens", async () => {
    const { module } = await renderHeader("/drive");

    expect(module()?.querySelector("[data-slot=module-icon]")?.className).not.toContain("hidden");
    expect(module()?.querySelector("span:not([data-slot])")?.className).toContain(
      "max-[760px]:sr-only",
    );
  });
});

describe("AppHeader sidebar toggle", () => {
  it("keeps the sidebar's own trigger, hidden from `md` up where the sidebar has one", async () => {
    const { trigger } = await renderHeader("/drive");

    expect(trigger()?.className).toContain("md:hidden");
    expect(trigger()?.getAttribute("aria-label")).toBe("Collapse sidebar");
  });

  it("names the module only while the docked sidebar is collapsed", async () => {
    const { module, trigger } = await renderHeader("/settings/account");
    // An expanded sidebar names the module itself, from `md` up.
    expect(module()?.className).toContain("md:hidden");

    const toggle = trigger();
    if (!toggle) throw new Error("Missing the sidebar trigger");
    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-label")).toBe("Expand sidebar");
    expect(module()?.className).not.toContain("md:hidden");
  });
});

describe("AppHeader search", () => {
  it.each([
    ["Meta", { metaKey: true }],
    ["Control", { ctrlKey: true }],
  ])("focuses the search field with %s+K", async (_, modifier) => {
    const { search } = await renderHeader("/");

    const event = new KeyboardEvent("keydown", { key: "k", cancelable: true, ...modifier });
    window.dispatchEvent(event);

    expect(document.activeElement).toBe(search);
    expect(event.defaultPrevented).toBe(true);
  });

  it("shows the shortcut for the platform", async () => {
    const { header, search } = await renderHeader("/");

    expect(header.getByText("Ctrl+K").getAttribute("aria-hidden")).toBe("true");
    expect(search.getAttribute("aria-keyshortcuts")).toBe("Control+K");
  });

  it("groups matching settings pages under Settings and opens the chosen one", async () => {
    const { router, search } = await renderHeader("/");
    search.focus();

    type(search, "theme");

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Settings")).toBeDefined();
    const option = within(listbox).getByRole("option");
    expect(option.textContent).toBe("AppearanceSettings · Your account");

    fireEvent.click(option);

    await waitFor(() => expect(router.state.location.pathname).toBe("/settings/appearance"));
    expect(search.value).toBe("");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("highlights the first result, so Enter opens it", async () => {
    const { router, search } = await renderHeader("/");
    search.focus();
    type(search, "password");

    const option = await screen.findByRole("option", { name: /Sign-in & security/ });
    await waitFor(() => expect(search.getAttribute("aria-activedescendant")).toBe(option.id));
    fireEvent.keyDown(search, { key: "Enter" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/settings/security"));
  });

  it("leaves out instance administration for people who aren't administrators", async () => {
    const { search } = await renderHeader("/");
    search.focus();

    type(search, "installation");

    expect(await screen.findByText(/^No matches for “installation”/)).toBeDefined();
  });

  it("says when nothing matches", async () => {
    const { search } = await renderHeader("/");
    search.focus();

    type(search, "quarterly report");

    expect((await screen.findByText(/^No matches/)).textContent).toContain(
      "No matches for “quarterly report” in your installed modules.",
    );
    expect(screen.queryAllByRole("option")).toEqual([]);
  });

  it("clears the query with Escape", async () => {
    const { search } = await renderHeader("/");
    search.focus();
    type(search, "profile");
    await screen.findByRole("option", { name: /Profile/ });

    fireEvent.keyDown(search, { key: "Escape" });

    expect(search.value).toBe("");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });

  it("closes the results when notifications open, and the reverse", async () => {
    const { header, search } = await renderHeader("/");
    search.focus();
    type(search, "profile");
    await screen.findByRole("listbox");

    // While the results show, the rest of the page is hidden from assistive technology.
    fireEvent.click(header.getByLabelText("Notifications", { selector: "button" }));

    expect(await screen.findByRole("dialog", { name: "Notifications" })).toBeDefined();
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());

    search.focus();
    type(search, "security");

    expect(await screen.findByRole("listbox")).toBeDefined();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("AppHeader notifications", () => {
  it("shows an empty panel, without an unread dot or a way to mark anything read", async () => {
    const { header } = await renderHeader("/");
    const button = header.getByRole("button", { name: "Notifications" });
    expect(button.querySelector("[data-slot=notifications-unread]")).toBeNull();

    fireEvent.click(button);

    const panel = await screen.findByRole("dialog", { name: "Notifications" });
    expect(within(panel).getByText("No notifications")).toBeDefined();
    expect(within(panel).queryByRole("button", { name: "Mark all read" })).toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(panel, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

async function openMenu(url = "/") {
  const rendered = await renderHeader(url);
  const trigger = rendered.header.getByRole("button", { name: "Account: Ada Lovelace" });
  expect(trigger.textContent).toBe("AL");
  expect(trigger.getAttribute("aria-haspopup")).toBe("menu");

  fireEvent.click(trigger);
  return { ...rendered, menu: within(await screen.findByRole("menu")) };
}

describe("AppHeader account menu", () => {
  it("shows who's signed in, their settings, appearance, and sign-out", async () => {
    const { menu } = await openMenu();

    expect(menu.getByText("Ada Lovelace")).toBeDefined();
    expect(menu.getByText("ada@example.com")).toBeDefined();
    expect(menu.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Profile and preferences",
      "Appearance",
      "Settings",
      "Sign out",
    ]);
    expect(
      menu.getByRole("menuitem", { name: "Profile and preferences" }).getAttribute("href"),
    ).toBe("/settings/account");
    expect(menu.getByRole("menuitem", { name: "Settings" }).getAttribute("href")).toBe("/settings");
  });

  it("signs out through the auth client and goes to sign-in", async () => {
    signOut.mockResolvedValue({ error: null });
    const { menu, router } = await openMenu();

    fireEvent.click(menu.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/sign-in"));
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("stays put if signing out fails", async () => {
    signOut.mockResolvedValue({ error: { message: "Offline" } });
    const { menu, router } = await openMenu("/drive");

    fireEvent.click(menu.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(router.state.location.pathname).toBe("/drive");
  });
});
