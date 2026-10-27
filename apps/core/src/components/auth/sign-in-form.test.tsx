// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignInForm } from "~/components/auth/sign-in-form";

type Result = { error: { status: number; message?: string } | null };

const signInEmail = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
const signInUsername = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
vi.mock("~/auth/auth-client", () => ({
  authClient: { signIn: { email: signInEmail, username: signInUsername } },
}));

function renderForm() {
  const onSignedIn = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const { container } = render(<SignInForm onSignedIn={onSignedIn} />);

  return {
    onSignedIn,
    identifier: screen.getByLabelText<HTMLInputElement>("Email or username"),
    password: screen.getByLabelText<HTMLInputElement>("Password"),
    submit: () => fireEvent.click(screen.getByRole("button", { name: /^sign/i })),
    fieldset: () => container.querySelector("fieldset"),
  };
}

function type(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

describe("SignInForm", () => {
  beforeEach(() => {
    signInEmail.mockReset();
    signInUsername.mockReset();
  });

  afterEach(cleanup);

  it("shows each field's error and focuses the first invalid field", async () => {
    const { identifier, submit, fieldset } = renderForm();
    // Browsers ignore focus on disabled fields, so the field must be enabled when focused.
    const disabledOnFocus: (boolean | undefined)[] = [];
    identifier.addEventListener("focus", () => disabledOnFocus.push(fieldset()?.disabled));

    submit();

    expect(await screen.findByText("Enter your email or username")).toBeTruthy();
    expect(screen.getByText("Enter your password")).toBeTruthy();
    expect(identifier.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(identifier);
    expect(disabledOnFocus).toEqual([false]);
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("clears a field's error once it is corrected", async () => {
    const { identifier, submit } = renderForm();
    submit();
    await screen.findByText("Enter your email or username");

    type(identifier, "ada@example.com");

    await waitFor(() => expect(screen.queryByText("Enter your email or username")).toBeNull());
  });

  it("disables the form while signing in, then hands over", async () => {
    const response = Promise.withResolvers<Result>();
    signInEmail.mockReturnValue(response.promise);
    const { identifier, password, submit, fieldset, onSignedIn } = renderForm();

    type(identifier, " ada@example.com ");
    type(password, "correct horse battery");
    submit();

    expect(await screen.findByRole("button", { name: "Signing in…" })).toBeTruthy();
    expect(fieldset()?.disabled).toBe(true);
    expect(signInEmail).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct horse battery",
    });

    expect(signInUsername).not.toHaveBeenCalled();

    response.resolve({ error: null });
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
  });

  it("signs in with a username when there is no @", async () => {
    signInUsername.mockResolvedValue({ error: null });
    const { identifier, password, submit, onSignedIn } = renderForm();

    type(identifier, "Ada.Lovelace");
    type(password, "correct horse battery");
    submit();

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
    expect(signInUsername).toHaveBeenCalledWith({
      username: "Ada.Lovelace",
      password: "correct horse battery",
    });
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("shows the server's error and lets the user try again", async () => {
    signInUsername.mockResolvedValue({
      error: { status: 401, message: "Invalid username or password" },
    });
    const { identifier, password, submit, fieldset, onSignedIn } = renderForm();

    type(identifier, "ada");
    type(password, "incorrect horse battery");
    submit();

    // The same message for either kind of sign-in.
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Incorrect email, username or password.",
    );
    await waitFor(() => expect(fieldset()?.disabled).toBe(false));
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it("explains rate limiting", async () => {
    signInEmail.mockResolvedValue({ error: { status: 429 } });
    const { identifier, password, submit } = renderForm();

    type(identifier, "ada@example.com");
    type(password, "correct horse battery");
    submit();

    expect((await screen.findByRole("alert")).textContent).toContain("Too many attempts");
  });
});
