// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SetupForm } from "~/components/auth/setup-form";

type Result = { error: { status: number; message?: string } | null };

const signUpEmail = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { signUp: { email: signUpEmail } } }));

// The form links to sign-in, so it renders inside a router.
async function renderForm() {
  const onCreated = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const rootRoute = createRootRoute({ component: () => <SetupForm onCreated={onCreated} /> });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/sign-in" }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("heading", { name: "Set up Alcove" });

  return {
    onCreated,
    field: (label: string) => screen.getByLabelText<HTMLInputElement>(label),
    submit: () => fireEvent.click(screen.getByRole("button", { name: /create/i })),
  };
}

function requirement(text: string) {
  return screen.getByText(text).closest("li");
}

function type(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

async function fillIn(field: (label: string) => HTMLInputElement, confirmPassword: string) {
  type(field("Name"), " Ada Lovelace ");
  type(field("Username"), "Ada.Lovelace");
  type(field("Email"), "ada@example.com");
  type(field("Password"), "correct horse battery");
  type(field("Confirm password"), confirmPassword);
}

describe("SetupForm", () => {
  beforeEach(() => {
    signUpEmail.mockReset();
  });

  afterEach(cleanup);

  it("shows each field's error and focuses the first invalid field", async () => {
    const { field, submit } = await renderForm();
    type(field("Password"), "short");
    // Browsers ignore focus on disabled fields, so the field must be enabled when focused.
    const disabledOnFocus: (boolean | undefined)[] = [];
    field("Name").addEventListener("focus", (event) => {
      if (event.target instanceof HTMLElement) {
        disabledOnFocus.push(event.target.closest("fieldset")?.disabled);
      }
    });

    submit();

    expect(await screen.findByText("Enter your name")).toBeTruthy();
    expect(screen.getByText("Choose a username")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address")).toBeTruthy();
    expect(screen.getByText("Password must be at least 12 characters")).toBeTruthy();
    expect(document.activeElement).toBe(field("Name"));
    expect(disabledOnFocus).toEqual([false]);
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("requires the passwords to match", async () => {
    const { field, submit } = await renderForm();
    await fillIn(field, "correct horse battery staple");

    submit();

    expect(await screen.findByText("Passwords don't match")).toBeTruthy();
    expect(document.activeElement).toBe(field("Confirm password"));
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("updates the mismatch error as either password changes", async () => {
    const { field, submit } = await renderForm();
    await fillIn(field, "correct horse battery staple");
    submit();
    expect(await screen.findByText("Passwords don't match")).toBeTruthy();
    expect(field("Confirm password").getAttribute("aria-invalid")).toBe("true");

    type(field("Confirm password"), "correct horse battery");
    await waitFor(() => expect(screen.queryByText("Passwords don't match")).toBeNull());
    expect(field("Confirm password").getAttribute("aria-invalid")).toBe("false");

    type(field("Password"), "correct horse battery!");
    expect(await screen.findByText("Passwords don't match")).toBeTruthy();

    type(field("Password"), "correct horse battery");
    await waitFor(() => expect(screen.queryByText("Passwords don't match")).toBeNull());
  });

  it("creates the administrator from the validated details", async () => {
    signUpEmail.mockResolvedValue({ error: null });
    const { field, submit, onCreated } = await renderForm();
    await fillIn(field, "correct horse battery");

    submit();

    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
    // Trimmed and normalized, and without the confirmation, which only the form needs.
    expect(signUpEmail).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      username: "ada.lovelace",
      email: "ada@example.com",
      password: "correct horse battery",
    });
  });

  it("rejects a password containing the username", async () => {
    const { field, submit } = await renderForm();
    await fillIn(field, "ada.lovelace rules");
    type(field("Password"), "ada.lovelace rules");

    submit();

    expect(await screen.findByText("Password can't contain your username or email")).toBeTruthy();
    expect(document.activeElement).toBe(field("Password"));
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("shows and hides the password", async () => {
    const { field } = await renderForm();
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(field("Password").type).toBe("password");

    fireEvent.click(toggle);

    expect(field("Password").type).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(toggle);

    expect(field("Password").type).toBe("password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("checks the password against the requirements as it is typed", async () => {
    const { field } = await renderForm();
    type(field("Username"), "lovelace");

    type(field("Password"), "lovelace");
    expect(requirement("At least 12 characters")?.dataset.met).toBe("false");
    expect(requirement("Doesn’t contain your username or email")?.dataset.met).toBe("false");
    expect(screen.getByText("Weak")).toBeTruthy();

    type(field("Password"), "gT7#qL9!vR2@mX4p");
    expect(requirement("At least 12 characters")?.dataset.met).toBe("true");
    expect(requirement("Doesn’t contain your username or email")?.dataset.met).toBe("true");
    expect(screen.getByText("Strong")).toBeTruthy();
    // Announced with the password field.
    const details = field("Password").getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(details)?.textContent).toContain("Password strength: Strong");
  });

  it("disables the form while creating the account", async () => {
    signUpEmail.mockReturnValue(new Promise(() => {}));
    const { field, submit } = await renderForm();
    await fillIn(field, "correct horse battery");

    submit();

    const button = await screen.findByRole("button", { name: "Creating account…" });
    expect(button.closest("fieldset")?.disabled).toBe(true);
  });

  it("points to sign-in when another request completed setup first", async () => {
    signUpEmail.mockResolvedValue({
      error: {
        status: 403,
        message: "Registration is closed. Ask an administrator for an account.",
      },
    });
    const { field, submit, onCreated } = await renderForm();
    await fillIn(field, "correct horse battery");

    submit();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Registration is closed");
    expect(screen.getByRole("link", { name: "Go to sign in" }).getAttribute("href")).toBe(
      "/sign-in",
    );
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("shows other server errors without the sign-in link", async () => {
    signUpEmail.mockResolvedValue({
      error: { status: 400, message: "Enter a valid email address" },
    });
    const { field, submit } = await renderForm();
    await fillIn(field, "correct horse battery");

    submit();

    expect((await screen.findByRole("alert")).textContent).toContain("Enter a valid email address");
    expect(screen.queryByRole("link", { name: "Go to sign in" })).toBeNull();
  });
});
