// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordForm } from "~/components/settings/password-form";

type Result = { error: { status: number; code?: string; message?: string } | null };

const changePassword = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { changePassword } }));

const user = {
  id: "user-1",
  name: "Ada Lovelace",
  username: "lovelace",
  email: "ada@example.com",
  image: null,
  administrator: true,
};

function renderForm() {
  const onChanged = vi.fn<() => Promise<void>>(() => Promise.resolve());
  render(<PasswordForm user={user} onChanged={onChanged} />);

  return {
    onChanged,
    field: (label: string) => screen.getByLabelText<HTMLInputElement>(label),
    submit: () => fireEvent.click(screen.getByRole("button", { name: "Change password" })),
  };
}

function type(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

describe("PasswordForm", () => {
  beforeEach(() => {
    changePassword.mockReset();
  });

  afterEach(cleanup);

  it("applies the setup password rules to the new password", async () => {
    const { field, submit } = renderForm();
    type(field("Current password"), "correct horse battery");
    type(field("New password"), "lovelace forever");
    type(field("Confirm new password"), "lovelace forever");

    submit();

    expect(await screen.findByText("Password can't contain your username or email")).toBeTruthy();
    expect(document.activeElement).toBe(field("New password"));
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("requires the new passwords to match", async () => {
    const { field, submit } = renderForm();
    type(field("Current password"), "correct horse battery");
    type(field("New password"), "staple orbit lantern");
    type(field("Confirm new password"), "staple orbit lanterns");

    submit();

    expect(await screen.findByText("Passwords don't match")).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password, signs out other sessions, and clears the form", async () => {
    changePassword.mockResolvedValue({ error: null });
    const { field, submit, onChanged } = renderForm();
    type(field("Current password"), "correct horse battery");
    type(field("New password"), "staple orbit lantern");
    type(field("Confirm new password"), "staple orbit lantern");

    submit();

    expect((await screen.findByRole("status")).textContent).toContain(
      "your other sessions were signed out",
    );
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "correct horse battery",
      newPassword: "staple orbit lantern",
      revokeOtherSessions: true,
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    expect(field("New password").value).toBe("");
  });

  it("explains a wrong current password", async () => {
    changePassword.mockResolvedValue({
      error: { status: 400, code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    const { field, submit, onChanged } = renderForm();
    type(field("Current password"), "incorrect horse battery");
    type(field("New password"), "staple orbit lantern");
    type(field("Confirm new password"), "staple orbit lantern");

    submit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Your current password is incorrect.",
    );
    expect(onChanged).not.toHaveBeenCalled();
  });
});
