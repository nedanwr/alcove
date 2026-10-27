// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Card, CardContent, CardTitle } from "#ui/components/ui/card";

afterEach(cleanup);

describe("Card", () => {
  it("renders a flat div by default", () => {
    const { container } = render(
      <Card size="sm">
        <CardTitle>Storage</CardTitle>
      </Card>,
    );

    const card = container.firstElementChild;
    expect(card?.tagName).toBe("DIV");
    expect(card?.getAttribute("data-slot")).toBe("card");
    expect(card?.getAttribute("data-variant")).toBe("flat");
    expect(card?.getAttribute("data-size")).toBe("sm");
  });

  it("renders an interactive card as a toggle button", () => {
    const onClick = vi.fn<() => void>();
    render(
      <Card variant="interactive" render={<button type="button" />} aria-pressed onClick={onClick}>
        <CardContent>Documents</CardContent>
      </Card>,
    );

    const card = screen.getByRole("button", { name: "Documents", pressed: true });
    expect(card.getAttribute("data-variant")).toBe("interactive");
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
