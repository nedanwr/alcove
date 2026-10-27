// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from "vitest";

import { authEnv } from "~/auth/env";

const secret = "q3Vh8zN0m4cJ2rW6tY1uI5oP9aS7dF3gH0jK2lZ4xC8=";
const valid = { BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: "http://localhost:3000" };

describe("authEnv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["http://localhost:3000", "https://alcove.example.com", "https://alcove.example.com/"])(
    "accepts the origin %s",
    (url) => {
      expect(authEnv({ ...valid, BETTER_AUTH_URL: url }).BETTER_AUTH_URL).toBe(url);
    },
  );

  it.each([
    ["missing secret", { BETTER_AUTH_SECRET: undefined }],
    ["short secret", { BETTER_AUTH_SECRET: "too-short" }],
    ["missing URL", { BETTER_AUTH_URL: undefined }],
    ["URL without a protocol", { BETTER_AUTH_URL: "localhost:3000" }],
    ["non-HTTP URL", { BETTER_AUTH_URL: "ftp://alcove.example.com" }],
    ["URL with a path", { BETTER_AUTH_URL: "https://example.com/alcove" }],
    ["URL with a query", { BETTER_AUTH_URL: "https://alcove.example.com?next=/" }],
  ])("rejects a %s", (_, overrides) => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => authEnv({ ...valid, ...overrides })).toThrow("Invalid environment variables");
  });

  it("does not log the secret when validation fails", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => authEnv({ ...valid, BETTER_AUTH_URL: "not a url" })).toThrow(
      "Invalid environment variables",
    );
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain(secret);
  });
});
