// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { installationSettingsSchema } from "~/installation";

describe("installationSettingsSchema", () => {
  it("trims the name", () => {
    expect(installationSettingsSchema.parse({ name: "  Lovelace Labs " })).toEqual({
      name: "Lovelace Labs",
    });
  });

  it.each([
    ["a blank name", { name: "  " }],
    ["a long name", { name: "a".repeat(65) }],
    ["an unexpected field", { name: "Lovelace Labs", initializedAt: "2026-01-01" }],
  ])("rejects %s", (_, value) => {
    expect(installationSettingsSchema.safeParse(value).success).toBe(false);
  });
});
