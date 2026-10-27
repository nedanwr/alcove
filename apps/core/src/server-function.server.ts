// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";

import { PublicError } from "~/public-error";

/**
 * Disables caching and lets only a `PublicError` reach the browser as is. TanStack Start sends a
 * thrown error's message to the browser, and database errors include the failed SQL and its
 * parameters, so any other error is logged and replaced with a generic one.
 */
export async function runServerFunction<T>(description: string, body: () => Promise<T>) {
  setResponseHeader("Cache-Control", "private, no-store");
  try {
    return await body();
  } catch (error) {
    // Start serializes a server function's error into a `200` response unless told otherwise.
    if (error instanceof PublicError) {
      setResponseStatus(error.status);
      throw error;
    }
    console.error(`Couldn't ${description}`, error);
    setResponseStatus(500);
    // Start doesn't serialize `cause`.
    throw new Error("Something went wrong. Try again in a moment.", { cause: error });
  }
}
