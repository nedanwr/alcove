// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl, SegmentedControlItem } from "#ui/components/ui/segmented-control";
import { Swatch, SwatchGroup } from "#ui/components/ui/swatch-group";

afterEach(cleanup);

describe("SegmentedControl", () => {
  it("is a labelled radio group whose options can be chosen", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <SegmentedControl aria-label="View" value="list" onValueChange={onValueChange}>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
      </SegmentedControl>,
    );

    expect(screen.getByRole("radiogroup", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "List" }).getAttribute("aria-checked")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: "Grid" }));

    expect(onValueChange).toHaveBeenCalledWith("grid", expect.anything());
  });

  it("ignores its options while disabled", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <SegmentedControl aria-label="View" value="list" disabled onValueChange={onValueChange}>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
      </SegmentedControl>,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Grid" }));

    expect(screen.getByRole("radiogroup").getAttribute("aria-disabled")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("SwatchGroup", () => {
  it("names each colour and marks the selected one with a check", () => {
    render(
      <SwatchGroup aria-label="Colour" value="teal">
        <Swatch value="teal" color="#0F766E" label="Teal" />
        <Swatch value="rose" color="#BE185D" label="Rose" />
      </SwatchGroup>,
    );

    const teal = screen.getByRole("radio", { name: "Teal" });
    const rose = screen.getByRole("radio", { name: "Rose" });
    expect(teal.getAttribute("aria-checked")).toBe("true");
    expect(teal.querySelector("svg")).toBeTruthy();
    expect(rose.getAttribute("aria-checked")).toBe("false");
    expect(rose.querySelector("svg")).toBeNull();
  });
});
