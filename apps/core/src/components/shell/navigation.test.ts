// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FolderIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { createNavigation, navigation, splitOverflow } from "~/components/shell/navigation";

const titles = (items: readonly { title: string }[]) => items.map((item) => item.title);

describe("createNavigation", () => {
  it("lists module destinations after Core's own, under a Modules heading", () => {
    const { groups, footer } = createNavigation([
      { title: "Drive", to: "/drive", icon: FolderIcon },
    ]);

    expect(groups.map((group) => [group.label, titles(group.items)])).toEqual([
      [undefined, ["Dashboard"]],
      ["Modules", ["Drive"]],
    ]);
    expect(titles(footer)).toEqual(["Settings"]);
  });

  it("omits the Modules group when no modules contribute destinations", () => {
    expect(createNavigation([]).groups.map((group) => group.id)).toEqual(["core"]);
  });
});

describe("navigation", () => {
  it("keeps Dashboard, Drive, and Settings available", () => {
    const items = [...navigation.groups.flatMap((group) => group.items), ...navigation.footer];

    expect(items.map((item) => item.to)).toEqual(["/", "/drive", "/settings"]);
  });
});

describe("splitOverflow", () => {
  it("keeps every item when they fit", () => {
    expect(splitOverflow([1, 2, 3], 3)).toEqual({ visible: [1, 2, 3], overflow: [] });
  });

  it("moves the items past the limit, in order, to the overflow", () => {
    expect(splitOverflow([1, 2, 3, 4, 5, 6, 7, 8], 6)).toEqual({
      visible: [1, 2, 3, 4, 5, 6],
      overflow: [7, 8],
    });
  });
});
