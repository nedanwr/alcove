// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Input } from "#ui/components/ui/input";

afterEach(cleanup);

describe("Input", () => {
  it("renders a bordered input on its own by default", () => {
    const { container } = render(<Input aria-label="Name" />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(container.firstElementChild).toBe(input);
    expect(input.dataset.variant).toBe("default");
    expect(input.className).toContain("border-input");
    expect(document.querySelector('[data-slot="input-edit-icon"]')).toBeNull();
  });

  it("keeps a transparent border on a ghost input, so focusing doesn't shift it", () => {
    render(<Input aria-label="Name" variant="ghost" />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input.dataset.variant).toBe("ghost");
    expect(input.className).toMatch(/(^| )border( |$)/);
    expect(input.className).toContain("border-transparent");
    expect(input.className).not.toContain("border-input");
    expect(input.className).toContain("focus-visible:border-ring");
  });

  it("adds a decorative pencil after the input, clear of its text and the pointer", () => {
    render(<Input aria-label="Name" aria-invalid variant="ghost" editIcon />);

    const input = screen.getByRole("textbox", { name: "Name" });
    const icon = document.querySelector('[data-slot="input-edit-icon"]');
    expect(icon?.previousElementSibling).toBe(input);
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(icon?.getAttribute("class")).toContain("pointer-events-none");
    expect(input.className).toContain("pr-8");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});
