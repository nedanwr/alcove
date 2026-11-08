// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordSection } from "~/components/settings/password-section";
import { field, queryRibbon, renderSettingsPage, type } from "~/components/settings/testing";

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

const passwordFields = ["Current password", "New password", "Confirm new password"];

function renderSection() {
  const onChanged = vi.fn<() => Promise<void>>(() => Promise.resolve());
  renderSettingsPage(<PasswordSection user={user} onChanged={onChanged} />);
  return { onChanged };
}

async function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));
  return within(await screen.findByRole("dialog", { name: "Change password" }));
}

function submitButton() {
  return within(screen.getByRole("dialog")).getByRole<HTMLButtonElement>("button", {
    name: "Change password",
  });
}

function fill(currentPassword: string, newPassword: string, confirmPassword = newPassword) {
  type(field("Current password"), currentPassword);
  type(field("New password"), newPassword);
  type(field("Confirm new password"), confirmPassword);
}

describe("PasswordSection", () => {
  beforeEach(() => {
    changePassword.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a row without inventing when the password last changed", () => {
    renderSection();

    const section = screen.getByRole("region", { name: "Password" });
    expect(section.textContent).toContain("Use it with your email or username to sign in.");
    expect(section.textContent).not.toContain("Last changed");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a dialog that says what happens to other sessions", async () => {
    renderSection();

    const dialog = await openDialog();

    expect(
      dialog.getByText("Changing your password signs you out on all your other devices."),
    ).toBeTruthy();
    for (const label of passwordFields) expect(field(label).type).toBe("password");
    expect(dialog.getAllByRole("button", { name: "Show password" })).toHaveLength(3);
  });

  it("keeps the password out of the save ribbon", async () => {
    renderSection();
    await openDialog();

    type(field("New password"), "staple orbit lantern");

    expect(queryRibbon()).toBeNull();
  });

  it("discards what was typed when cancelled", async () => {
    renderSection();
    const dialog = await openDialog();
    fill("correct horse battery", "staple orbit lantern");

    fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(changePassword).not.toHaveBeenCalled();

    await openDialog();
    for (const label of passwordFields) expect(field(label).value).toBe("");
  });

  it("can only be submitted once every field is valid", async () => {
    renderSection();
    await openDialog();
    expect(submitButton().disabled).toBe(true);

    fill("correct horse battery", "short");
    expect(submitButton().disabled).toBe(true);

    fill("correct horse battery", "staple orbit lantern");
    expect(submitButton().disabled).toBe(false);
  });

  it("applies the setup password rules to the new password", async () => {
    renderSection();
    await openDialog();
    fill("correct horse battery", "lovelace forever");

    fireEvent.blur(field("New password"));

    expect(await screen.findByText("Password can't contain your username or email")).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
  });

  it("uses the application's password policy", async () => {
    renderSection();
    await openDialog();
    type(field("New password"), "short");

    fireEvent.blur(field("New password"));

    expect(await screen.findByText("Password must be at least 12 characters")).toBeTruthy();
  });

  it("requires the new passwords to match, and clears the error once they do", async () => {
    renderSection();
    await openDialog();
    fill("correct horse battery", "staple orbit lantern", "staple orbit lanterns");

    fireEvent.blur(field("Confirm new password"));

    expect(await screen.findByText("Passwords don't match")).toBeTruthy();
    expect(submitButton().disabled).toBe(true);

    type(field("Confirm new password"), "staple orbit lantern");

    await waitFor(() => expect(screen.queryByText("Passwords don't match")).toBeNull());
    expect(submitButton().disabled).toBe(false);
  });

  it("changes the password, closes, and confirms that other sessions were signed out", async () => {
    changePassword.mockResolvedValue({ error: null });
    const { onChanged } = renderSection();
    await openDialog();
    fill("correct horse battery", "staple orbit lantern");

    fireEvent.click(submitButton());

    expect((await screen.findByRole("status")).textContent).toContain(
      "your other sessions were signed out",
    );
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "correct horse battery",
      newPassword: "staple orbit lantern",
      revokeOtherSessions: true,
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("clears the fields and the confirmation when opened again after a change", async () => {
    changePassword.mockResolvedValue({ error: null });
    renderSection();
    await openDialog();
    fill("correct horse battery", "staple orbit lantern");
    fireEvent.click(submitButton());
    await screen.findByRole("status");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await openDialog();

    for (const label of passwordFields) expect(field(label).value).toBe("");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows that it's working, and can't be sent twice or dismissed meanwhile", async () => {
    const { promise, resolve } = Promise.withResolvers<Result>();
    changePassword.mockReturnValue(promise);
    renderSection();
    const dialog = await openDialog();
    fill("correct horse battery", "staple orbit lantern");
    const submit = submitButton();

    fireEvent.click(submit);
    fireEvent.click(submit);

    const pending = await dialog.findByRole<HTMLButtonElement>("button", {
      name: "Changing password…",
    });
    expect(pending.disabled).toBe(true);
    // A disabled fieldset disables its controls without setting their own `disabled` property.
    expect(field("Current password").closest("fieldset")?.disabled).toBe(true);
    expect(dialog.getByRole("button", { name: "Cancel" }).closest("fieldset")?.disabled).toBe(true);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();

    resolve({ error: null });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(changePassword).toHaveBeenCalledOnce();
  });

  it("explains a wrong current password and keeps the dialog open for another try", async () => {
    changePassword.mockResolvedValue({
      error: { status: 400, code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    const { onChanged } = renderSection();
    const dialog = await openDialog();
    fill("incorrect horse battery", "staple orbit lantern");

    fireEvent.click(submitButton());

    expect((await dialog.findByRole("alert")).textContent).toContain(
      "Your current password is incorrect.",
    );
    expect(onChanged).not.toHaveBeenCalled();
    expect(field("Current password").value).toBe("incorrect horse battery");
    expect(field("New password").value).toBe("staple orbit lantern");
    await waitFor(() => expect(document.activeElement).toBe(field("Current password")));
    expect(submitButton().disabled).toBe(false);
  });

  it("doesn't repeat a server failure's own message", async () => {
    changePassword.mockResolvedValue({
      error: { status: 500, message: "connection to 10.0.0.5:5432 refused" },
    });
    renderSection();
    const dialog = await openDialog();
    fill("correct horse battery", "staple orbit lantern");

    fireEvent.click(submitButton());

    expect((await dialog.findByRole("alert")).textContent).toBe("Something went wrong. Try again.");
  });

  it("reports a request that couldn't be sent", async () => {
    changePassword.mockRejectedValue(new TypeError("Failed to fetch"));
    renderSection();
    const dialog = await openDialog();
    fill("correct horse battery", "staple orbit lantern");

    fireEvent.click(submitButton());

    expect((await dialog.findByRole("alert")).textContent).toBe("Something went wrong. Try again.");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
