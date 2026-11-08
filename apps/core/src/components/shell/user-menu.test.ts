// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { initials } from "~/components/shell/user-menu";

describe("initials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["ada", "A"],
    ["  Grace  Brewster Hopper ", "GH"],
    ["émile zola", "ÉZ"],
    ["𝒜da Lovelace", "𝒜L"],
    ["", ""],
  ])("gives %j the initials %j", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
