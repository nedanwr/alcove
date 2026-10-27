// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { createRequestHandler, defaultRenderHandler } from "@tanstack/react-router/ssr/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  requireAdministrator,
  requireSignedOut,
  requireUninitialized,
  requireUser,
  type AuthState,
} from "~/auth/auth-state";
import { safeRedirect } from "~/auth/validation";

const user = {
  id: "user-1",
  name: "Ada Lovelace",
  username: "ada",
  email: "ada@example.com",
  image: null,
  administrator: true,
};

const fresh: AuthState = { initialized: false, user: null };
const signedOut: AuthState = { initialized: true, user: null };
const signedIn: AuthState = { initialized: true, user };
const member: AuthState = { initialized: true, user: { ...user, administrator: false } };

// Mirrors the app's route guards, with placeholder pages in place of the real ones.
function createTestRouter(auth: AuthState) {
  const rootRoute = createRootRoute({
    beforeLoad: () => ({ auth }),
    component: Outlet,
  });
  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_app",
    beforeLoad: ({ context, location }) => ({ user: requireUser(context.auth, location) }),
    component: () => (
      <main>
        Protected <Outlet />
      </main>
    ),
  });
  const authRoute = createRoute({ getParentRoute: () => rootRoute, id: "_auth" });

  return createRouter({
    routeTree: rootRoute.addChildren([
      appRoute.addChildren([
        createRoute({ getParentRoute: () => appRoute, path: "/", component: () => "Dashboard" }),
        createRoute({ getParentRoute: () => appRoute, path: "drive", component: () => "Drive" }),
        createRoute({
          getParentRoute: () => appRoute,
          path: "settings/account",
          component: () => "Account settings",
        }),
        createRoute({
          getParentRoute: () => appRoute,
          path: "settings/instance",
          beforeLoad: ({ context }) => requireAdministrator(context.user),
          component: () => "Instance settings",
        }),
      ]),
      authRoute.addChildren([
        createRoute({
          getParentRoute: () => authRoute,
          path: "sign-in",
          validateSearch: z.object({ redirect: z.unknown().transform(safeRedirect).optional() }),
          beforeLoad: ({ context, search }) => requireSignedOut(context.auth, search.redirect),
          component: () => "Sign in",
        }),
        createRoute({
          getParentRoute: () => authRoute,
          path: "setup",
          beforeLoad: ({ context }) => requireUninitialized(context.auth),
          component: () => "Setup",
        }),
      ]),
    ]),
  });
}

/** Server-renders `url`, following redirects, as a full page load does. */
async function visit(auth: AuthState, url: string) {
  const redirects: string[] = [];
  let href = url;

  for (;;) {
    const handle = createRequestHandler({
      request: new Request(new URL(href, "http://localhost")),
      createRouter: () => createTestRouter(auth),
    });
    const response = await handle(defaultRenderHandler);
    const location = response.headers.get("Location");

    if (!location) {
      if (!response.ok) throw new Error(`${href} responded with ${response.status}`);
      return { href, html: await response.text() };
    }
    // Redirects happen before rendering, so a redirected response never carries the page.
    if (response.status !== 307) throw new Error(`${href} redirected with ${response.status}`);
    if (redirects.length > 3) throw new Error(`Too many redirects: ${redirects.join(" → ")}`);
    redirects.push(location);
    href = location;
  }
}

describe("route protection", () => {
  it.each(["/", "/drive", "/sign-in"])(
    "sends a fresh installation from %s to setup",
    async (url) => {
      const { href, html } = await visit(fresh, url);

      expect(href).toBe("/setup");
      expect(html).not.toContain("Protected");
    },
  );

  it("sends signed-out visitors to sign-in without rendering the shell", async () => {
    const { href, html } = await visit(signedOut, "/");

    expect(href).toBe("/sign-in");
    expect(html).toContain("Sign in");
    expect(html).not.toContain("Protected");
  });

  it("remembers the requested page when sending visitors to sign-in", async () => {
    const { href } = await visit(signedOut, "/drive?sort=name");

    expect(new URL(href, "http://localhost").searchParams.get("redirect")).toBe("/drive?sort=name");
  });

  it.each(["/", "/drive"])("lets signed-in users open %s", async (url) => {
    const { href, html } = await visit(signedIn, url);

    expect(href).toBe(url);
    expect(html).toContain("Protected");
  });

  it("returns signed-in users from sign-in to the application", async () => {
    expect((await visit(signedIn, "/sign-in")).href).toBe("/");
  });

  it("returns signed-in users from sign-in to the page they asked for", async () => {
    expect((await visit(signedIn, "/sign-in?redirect=%2Fdrive")).href).toBe("/drive");
  });

  it("ignores redirects to other sites", async () => {
    const { href } = await visit(signedIn, "/sign-in?redirect=https%3A%2F%2Fevil.example%2F");

    expect(href).toBe("/");
  });

  it("opens instance settings for the administrator", async () => {
    const { href, html } = await visit(signedIn, "/settings/instance");

    expect(href).toBe("/settings/instance");
    expect(html).toContain("Instance settings");
  });

  it("sends other users from instance settings to their account settings", async () => {
    const { href, html } = await visit(member, "/settings/instance");

    expect(href).toBe("/settings/account");
    expect(html).not.toContain("Instance settings");
  });

  it("sends signed-out visitors from settings to sign-in", async () => {
    expect((await visit(signedOut, "/settings/instance")).href).toBe(
      "/sign-in?redirect=%2Fsettings%2Finstance",
    );
  });

  it("closes setup once the installation is initialized", async () => {
    expect((await visit(signedOut, "/setup")).href).toBe("/sign-in");
    expect((await visit(signedIn, "/setup")).href).toBe("/");
  });
});
