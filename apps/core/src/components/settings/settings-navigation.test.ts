// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { searchSettings } from "~/components/settings/settings-navigation";

const titles = (query: string, administrator = false) =>
  searchSettings(query, administrator).flatMap((group) =>
    group.items.map((item) => [item.title, item.location, item.to]),
  );

describe("searchSettings", () => {
  it("matches page names and their keywords, regardless of case", () => {
    expect(titles("APPEAR")).toEqual([
      ["Appearance", "Settings · Your account", "/settings/appearance"],
    ]);
    expect(titles("dark mode")).toEqual([
      ["Appearance", "Settings · Your account", "/settings/appearance"],
    ]);
  });

  it("groups the results under Settings", () => {
    expect(searchSettings("password", false).map((group) => group.source.title)).toEqual([
      "Settings",
    ]);
  });

  it("only finds instance administration for administrators", () => {
    expect(titles("installation")).toEqual([]);
    expect(titles("installation", true)).toEqual([
      ["General", "Settings · Instance administration", "/settings/instance"],
    ]);
  });

  it.each(["", "   ", "quarterly report"])("returns no groups for %j", (query) => {
    expect(searchSettings(query, true)).toEqual([]);
  });
});
