// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from "vitest";

import { createDatabase, type Database } from "./database";

const unreachable = "postgresql://alcove:alcove@127.0.0.1:1/alcove";

describe("createDatabase", () => {
  let db: Database | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    await db?.$client.end();
    db = undefined;
  });

  it("does not connect until the first query", () => {
    db = createDatabase(unreachable);

    expect(db.$client.totalCount).toBe(0);
  });

  it("survives errors on idle clients", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    db = createDatabase(unreachable);
    const error = new Error("terminating connection due to administrator command");

    expect(() => db?.$client.emit("error", error)).not.toThrow();
    expect(log).toHaveBeenCalledWith(expect.any(String), error);
  });
});
