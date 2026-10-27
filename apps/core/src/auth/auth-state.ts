// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { redirect } from "@tanstack/react-router";

/** The signed-in user, as exposed to the client. Session tokens never leave the server. */
export interface SessionUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  administrator: boolean;
}

// Deliberately omits the session token, which must never reach the browser.
export interface AccountSession {
  id: string;
  createdAt: Date;
  /** When the session was created or last extended. */
  updatedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  current: boolean;
}

/** Resolved on the server once per navigation and shared with every route through context. */
export interface AuthState {
  /** Whether the first administrator has been created. */
  initialized: boolean;
  user: SessionUser | null;
}

export function requireUser(auth: AuthState, location: { href: string }): SessionUser {
  if (!auth.initialized) throw redirect({ to: "/setup" });
  if (!auth.user) {
    throw redirect({
      to: "/sign-in",
      search: location.href === "/" ? {} : { redirect: location.href },
    });
  }
  return auth.user;
}

/** Guards sign-in: it is only useful once set up, and only to visitors who aren't signed in. */
export function requireSignedOut(auth: AuthState, redirectTo: string | undefined) {
  if (!auth.initialized) throw redirect({ to: "/setup" });
  if (auth.user) throw redirect({ href: redirectTo ?? "/" });
}

export function requireAdministrator(user: SessionUser) {
  if (!user.administrator) throw redirect({ to: "/settings/account" });
}

export function requireUninitialized(auth: AuthState) {
  if (auth.initialized) throw redirect({ to: auth.user ? "/" : "/sign-in" });
}
