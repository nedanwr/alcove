// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";

import { auth } from "~/auth/auth.server";
import { loadAuthState } from "~/auth/auth-state.server";

/**
 * Runs in-process during SSR and as an RPC on client navigation, so route guards always check
 * the session on the server.
 */
export const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  // The result, and any page rendered from it, is specific to the visitor's session.
  setResponseHeader("Cache-Control", "private, no-store");
  try {
    return await loadAuthState(auth, getRequestHeaders());
  } catch (error) {
    // TanStack Start sends a thrown error's message to the browser, and database errors include
    // the failed SQL and its parameters. Log the original and send a generic message instead;
    // Start doesn't serialize `cause`.
    console.error("Couldn't load the auth state", error);
    throw new Error("Alcove couldn't check your session. Try again in a moment.", { cause: error });
  }
});
