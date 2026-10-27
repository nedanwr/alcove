// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PublicError } from "~/public-error";
import { runServerFunction } from "~/server-function.server";

const setResponseHeader = vi.hoisted(() => vi.fn<(name: string, value: string) => void>());
const setResponseStatus = vi.hoisted(() => vi.fn<(status: number) => void>());
vi.mock("@tanstack/react-start/server", () => ({ setResponseHeader, setResponseStatus }));

describe("runServerFunction", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setResponseHeader.mockReset();
    setResponseStatus.mockReset();
  });

  it("returns the result and keeps it out of caches", async () => {
    expect(await runServerFunction("load", () => Promise.resolve("Lovelace Labs"))).toBe(
      "Lovelace Labs",
    );
    expect(setResponseHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(setResponseStatus).not.toHaveBeenCalled();
  });

  it("passes a public error through with its status", async () => {
    const error = new PublicError("Only the administrator can manage instance settings.", 403);

    await expect(runServerFunction("load", () => Promise.reject(error))).rejects.toBe(error);
    expect(setResponseStatus).toHaveBeenCalledWith(403);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("replaces any other error with a generic one, and logs the original", async () => {
    const error = new Error('Failed query: select "name" from "installation"');

    const result = runServerFunction("load instance settings", () => Promise.reject(error));

    await expect(result).rejects.toThrow("Something went wrong. Try again in a moment.");
    await expect(result).rejects.not.toThrow("Failed query");
    expect(setResponseStatus).toHaveBeenCalledWith(500);
    expect(console.error).toHaveBeenCalledWith("Couldn't load instance settings", error);
  });
});
