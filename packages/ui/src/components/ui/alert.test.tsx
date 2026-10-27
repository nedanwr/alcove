// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Alert, AlertDescription, AlertDismiss, AlertTitle } from "#ui/components/ui/alert";

afterEach(cleanup);

describe("Alert", () => {
  it.each([
    ["info", "status"],
    ["success", "status"],
    ["warning", "alert"],
    ["destructive", "alert"],
    ["default", "alert"],
  ] as const)("uses role=%s → %s", (variant, role) => {
    render(
      <Alert variant={variant}>
        <AlertTitle>Title</AlertTitle>
      </Alert>,
    );

    expect(screen.getByRole(role)).toHaveProperty("textContent", "Title");
  });

  it("renders the variant icon unless overridden", () => {
    const { container, rerender } = render(<Alert variant="warning" />);
    expect(container.querySelector("svg.lucide-triangle-alert")).not.toBeNull();

    rerender(<Alert variant="warning" icon={null} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("allows overriding the role", () => {
    render(<Alert variant="destructive" role="status" />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders a labelled dismiss button", () => {
    const onClick = vi.fn<() => void>();
    render(
      <Alert variant="info">
        <AlertDescription>Saved.</AlertDescription>
        <AlertDismiss onClick={onClick} />
      </Alert>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
