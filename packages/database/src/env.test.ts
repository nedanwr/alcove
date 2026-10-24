// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from "vitest";

import { databaseEnv } from "./env";

describe("databaseEnv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    "postgres://alcove:alcove@localhost:5432/alcove",
    "postgresql://alcove:alcove@db.internal/alcove?sslmode=require",
  ])("accepts %s", (url) => {
    expect(databaseEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not a URL", "localhost:5432/alcove"],
    ["not PostgreSQL", "mysql://alcove:alcove@localhost:3306/alcove"],
  ])("rejects a %s DATABASE_URL", (_, url) => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => databaseEnv({ DATABASE_URL: url })).toThrow("Invalid environment variables");
  });

  it("does not modify the runtime environment", () => {
    const runtimeEnv = { DATABASE_URL: "postgres://alcove:alcove@localhost/alcove", UNRELATED: "" };

    databaseEnv(runtimeEnv);

    expect(runtimeEnv).toEqual({
      DATABASE_URL: "postgres://alcove:alcove@localhost/alcove",
      UNRELATED: "",
    });
  });

  it("does not log credentials when validation fails", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => databaseEnv({ DATABASE_URL: "mysql://alcove:s3cret@localhost/alcove" })).toThrow(
      "Invalid environment variables",
    );
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain("s3cret");
  });
});
