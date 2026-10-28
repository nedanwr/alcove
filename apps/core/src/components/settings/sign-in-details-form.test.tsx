// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignInDetailsForm } from "~/components/settings/sign-in-details-form";
import {
  clickRibbon,
  field,
  queryRibbon,
  renderSettingsPage,
  ribbonDescription,
  ribbonTitle,
  type,
} from "~/components/settings/testing";

type Result = { error: { status: number; code?: string; message?: string } | null };

const updateUser = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
const changeEmail = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { updateUser, changeEmail } }));

function renderForm() {
  const onSaved = vi.fn<() => Promise<void>>(() => Promise.resolve());
  renderSettingsPage(
    <SignInDetailsForm username="ada" email="ada@example.com" onSaved={onSaved} />,
  );
  return { onSaved };
}

const reauthentication = { body: { currentPassword: "correct horse battery" } };

describe("SignInDetailsForm", () => {
  beforeEach(() => {
    updateUser.mockReset();
    changeEmail.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("has no save button of its own", () => {
    renderForm();

    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("doesn't count the current password as a change", () => {
    renderForm();

    type(field("Current password"), "correct horse battery");

    expect(queryRibbon()).toBeNull();
  });

  it("counts each changed detail, and nothing once both are changed back", () => {
    renderForm();

    type(field("Username"), "ada.king");
    type(field("Email"), "ada@example.org");
    expect(ribbonTitle()).toBe("2 unsaved changes");

    type(field("Username"), "ada");
    type(field("Email"), "ada@example.com");
    expect(queryRibbon()).toBeNull();
  });

  it("requires the current password, and shows where it goes", async () => {
    renderForm();
    type(field("Username"), "ada.king");

    clickRibbon("Save");

    expect(await screen.findByText("Enter your current password")).toBeTruthy();
    expect(ribbonTitle()).toBe("Some fields need attention");
    expect(updateUser).not.toHaveBeenCalled();

    clickRibbon("Show problems");
    expect(document.activeElement).toBe(field("Current password"));
  });

  it("sends only a changed username, normalized, with the current password, then clears it", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { onSaved } = renderForm();
    type(field("Username"), "Ada.King");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledExactlyOnceWith({
      username: "ada.king",
      fetchOptions: reauthentication,
    });
    expect(changeEmail).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledOnce();
    expect(field("Username").value).toBe("ada.king");
    expect(field("Current password").value).toBe("");
  });

  it("changes the email", async () => {
    changeEmail.mockResolvedValue({ error: null });
    renderForm();
    type(field("Email"), " ada@example.org ");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(changeEmail).toHaveBeenCalledExactlyOnceWith({
      newEmail: "ada@example.org",
      fetchOptions: reauthentication,
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("keeps the email pending when only the username was saved, and retries just the email", async () => {
    updateUser.mockResolvedValue({ error: null });
    changeEmail.mockResolvedValueOnce({
      error: {
        status: 400,
        code: "EMAIL_UNAVAILABLE",
        message: "This email is already used by another account",
      },
    });
    const { onSaved } = renderForm();
    type(field("Username"), "ada.king");
    type(field("Email"), "grace@example.com");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Some changes couldn’t be saved"));
    expect(ribbonDescription()).toBe(
      "Your username was updated, but not your email. This email is already used by another account",
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(field("Email").value).toBe("grace@example.com");
    expect(field("Current password").value).toBe("correct horse battery");

    changeEmail.mockResolvedValueOnce({ error: null });
    type(field("Email"), "ada@example.org");
    clickRibbon("Retry");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledOnce();
    expect(changeEmail).toHaveBeenLastCalledWith({
      newEmail: "ada@example.org",
      fetchOptions: reauthentication,
    });
  });

  it("discards only what wasn't saved after a partial save", async () => {
    updateUser.mockResolvedValue({ error: null });
    changeEmail.mockResolvedValue({ error: { status: 500 } });
    renderForm();
    type(field("Username"), "ada.king");
    type(field("Email"), "grace@example.com");
    type(field("Current password"), "correct horse battery");
    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Some changes couldn’t be saved"));

    clickRibbon("Discard");

    expect(field("Username").value).toBe("ada.king");
    expect(field("Email").value).toBe("ada@example.com");
    expect(field("Current password").value).toBe("");
    expect(queryRibbon()).toBeNull();
  });

  it("explains a wrong current password, keeping the changes", async () => {
    updateUser.mockResolvedValue({
      error: { status: 400, code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    const { onSaved } = renderForm();
    type(field("Username"), "ada.king");
    type(field("Current password"), "incorrect horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Couldn’t save your changes"));
    expect(ribbonDescription()).toBe("Your current password is incorrect.");
    expect(field("Username").value).toBe("ada.king");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("discards changes and the current password", () => {
    renderForm();
    type(field("Username"), "ada.king");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Discard");

    expect(field("Username").value).toBe("ada");
    expect(field("Current password").value).toBe("");
    expect(queryRibbon()).toBeNull();
  });

  it("sends nothing when a change only differs in case from the saved email", async () => {
    renderForm();
    type(field("Email"), "Ada@Example.com");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(changeEmail).not.toHaveBeenCalled();
    expect(field("Email").value).toBe("ada@example.com");
  });
});
