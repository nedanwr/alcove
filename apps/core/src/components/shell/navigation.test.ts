// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { splitOverflow } from "~/components/shell/navigation";

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
