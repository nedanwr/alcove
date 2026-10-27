// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Field, FieldCounter, FieldError, FieldLabel } from "#ui/components/ui/field";
import { Input } from "#ui/components/ui/input";
import { LabelOptional, LabelRequired } from "#ui/components/ui/label";

afterEach(cleanup);

describe("Field", () => {
  it("associates an error with an invalid input", () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" aria-invalid aria-describedby="email-error" />
        <FieldError id="email-error">Enter a valid email.</FieldError>
      </Field>,
    );

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });

  it("renders nothing without an error", () => {
    const { container } = render(<FieldError errors={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("deduplicates repeated error messages", () => {
    render(<FieldError errors={[{ message: "Required." }, { message: "Required." }]} />);

    expect(screen.getByRole("alert").textContent).toBe("Required.");
  });

  it("hides the required marker from the accessible name", () => {
    render(
      <Field>
        <FieldLabel htmlFor="name">
          Name <LabelRequired />
        </FieldLabel>
        <Input id="name" required />
      </Field>,
    );

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input.hasAttribute("required")).toBe(true);
  });

  it("includes the optional marker in the accessible name", () => {
    render(
      <Field>
        <FieldLabel htmlFor="bio">
          Bio <LabelOptional />
        </FieldLabel>
        <Input id="bio" />
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "Bio (optional)" })).toBeDefined();
  });
});

describe("FieldCounter", () => {
  it.each([
    [0, "false"],
    [91, "false"],
    [92, "true"],
    [100, "true"],
  ])("at %i of 100 sets data-warning=%s", (count, warning) => {
    render(<FieldCounter count={count} max={100} />);

    const counter = screen.getByText(`${count}/100`);
    expect(counter.dataset["warning"]).toBe(warning);
  });
});
