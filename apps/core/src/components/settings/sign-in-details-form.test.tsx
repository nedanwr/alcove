// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignInDetailsForm } from "~/components/settings/sign-in-details-form";

type Result = { error: { status: number; code?: string; message?: string } | null };

const updateUser = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
const changeEmail = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { updateUser, changeEmail } }));

function renderForm() {
  const onSaved = vi.fn<() => Promise<void>>(() => Promise.resolve());
  render(<SignInDetailsForm username="ada" email="ada@example.com" onSaved={onSaved} />);

  return {
    onSaved,
    field: (label: string) => screen.getByLabelText<HTMLInputElement>(label),
    submit: () => fireEvent.click(screen.getByRole("button", { name: "Save" })),
  };
}

function type(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

const reauthentication = { body: { currentPassword: "correct horse battery" } };

describe("SignInDetailsForm", () => {
  beforeEach(() => {
    updateUser.mockReset();
    changeEmail.mockReset();
  });

  afterEach(cleanup);

  it("requires the current password", async () => {
    const { field, submit } = renderForm();
    type(field("Username"), "ada.king");

    submit();

    expect(await screen.findByText("Enter your current password")).toBeTruthy();
    expect(document.activeElement).toBe(field("Current password"));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("sends only a changed username, normalized, with the current password", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { field, submit, onSaved } = renderForm();
    type(field("Username"), "Ada.King");
    type(field("Current password"), "correct horse battery");

    submit();

    expect((await screen.findByRole("status")).textContent).toContain("Your username was updated.");
    expect(updateUser).toHaveBeenCalledWith({
      username: "ada.king",
      fetchOptions: reauthentication,
    });
    expect(changeEmail).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledOnce();
    expect(field("Current password").value).toBe("");
  });

  it("changes the email", async () => {
    changeEmail.mockResolvedValue({ error: null });
    const { field, submit } = renderForm();
    type(field("Email"), " ada@example.org ");
    type(field("Current password"), "correct horse battery");

    submit();

    expect((await screen.findByRole("status")).textContent).toContain("Your email was updated.");
    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "ada@example.org",
      fetchOptions: reauthentication,
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("reports which change was saved when the other fails", async () => {
    updateUser.mockResolvedValue({ error: null });
    changeEmail.mockResolvedValue({
      error: {
        status: 400,
        code: "EMAIL_UNAVAILABLE",
        message: "This email is already used by another account",
      },
    });
    const { field, submit, onSaved } = renderForm();
    type(field("Username"), "ada.king");
    type(field("Email"), "grace@example.com");
    type(field("Current password"), "correct horse battery");

    submit();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Your username was updated, but not your email. This email is already used by another account",
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("explains a wrong current password", async () => {
    updateUser.mockResolvedValue({
      error: { status: 400, code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    const { field, submit, onSaved } = renderForm();
    type(field("Username"), "ada.king");
    type(field("Current password"), "incorrect horse battery");

    submit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Your current password is incorrect.",
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("does nothing when neither detail changed", async () => {
    const { field, submit } = renderForm();
    type(field("Current password"), "correct horse battery");

    submit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Change your username or email first.",
    );
    expect(updateUser).not.toHaveBeenCalled();
    expect(changeEmail).not.toHaveBeenCalled();
  });
});
