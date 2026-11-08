// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalDetailsForm } from "~/components/settings/personal-details-form";
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
    <PersonalDetailsForm
      details={{ name: "Ada", email: "ada@example.com", username: "ada" }}
      onSaved={onSaved}
    />,
  );
  return { onSaved };
}

function queryPassword() {
  return screen.queryByLabelText<HTMLInputElement>("Current password");
}

const reauthentication = { body: { currentPassword: "correct horse battery" } };

describe("PersonalDetailsForm", () => {
  beforeEach(() => {
    updateUser.mockReset();
    changeEmail.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the saved details, with no save button of its own and no ribbon", () => {
    renderForm();
    fireEvent.focus(field("Name"));
    fireEvent.blur(field("Name"));

    expect(screen.getByRole("region", { name: "Personal details" })).toBeTruthy();
    expect(field("Name").value).toBe("Ada");
    expect(field("Email").value).toBe("ada@example.com");
    expect(field("Username").value).toBe("ada");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(queryRibbon()).toBeNull();
  });

  it("shows the details as ghost inputs with an edit hint, but not the current password", () => {
    renderForm();
    type(field("Username"), "ada.king");

    for (const label of ["Name", "Email", "Username"]) {
      const input = field(label);
      expect(input.dataset.variant).toBe("ghost");
      expect(input.className).toContain("text-end");
      expect(input.nextElementSibling?.getAttribute("data-slot")).toBe("input-edit-icon");
    }
    expect(field("Current password").dataset.variant).not.toBe("ghost");
  });

  it("counts each changed detail, and nothing once they're changed back", () => {
    renderForm();

    type(field("Name"), "Ada Lovelace");
    expect(ribbonTitle()).toBe("1 unsaved change");
    type(field("Username"), "ada.king");
    type(field("Email"), "ada@example.org");
    expect(ribbonTitle()).toBe("3 unsaved changes");

    type(field("Name"), "Ada");
    type(field("Username"), "ada");
    type(field("Email"), "ada@example.com");
    expect(queryRibbon()).toBeNull();
  });

  it("asks for the current password only while the email or username is changed", () => {
    renderForm();

    type(field("Name"), "Ada Lovelace");
    expect(queryPassword()).toBeNull();

    type(field("Username"), "ada.king");
    expect(queryPassword()).toBeTruthy();
    type(field("Username"), "ada");
    expect(queryPassword()).toBeNull();

    type(field("Email"), "ada@example.org");
    expect(queryPassword()).toBeTruthy();
  });

  it("doesn't count the current password as a change", () => {
    renderForm();
    type(field("Username"), "ada.king");
    type(field("Current password"), "correct horse battery");

    expect(ribbonTitle()).toBe("1 unsaved change");
  });

  it("saves a trimmed name without the current password", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { onSaved } = renderForm();
    type(field("Name"), "  Ada Lovelace ");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Ada Lovelace" });
    expect(changeEmail).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledOnce();
    expect(field("Name").value).toBe("Ada Lovelace");
  });

  it("returns to unsaved when edited while showing the saved confirmation", async () => {
    updateUser.mockResolvedValue({ error: null });
    renderForm();
    type(field("Name"), "Ada Lovelace");
    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));

    type(field("Name"), "Ada King");

    expect(ribbonTitle()).toBe("1 unsaved change");
  });

  it("sends one request however often Save is pressed while saving", async () => {
    const { promise, resolve } = Promise.withResolvers<Result>();
    updateUser.mockReturnValue(promise);
    renderForm();
    type(field("Name"), "Ada Lovelace");

    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Saving changes…"));
    clickRibbon("Save");
    resolve({ error: null });

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledOnce();
  });

  it("doesn't send an invalid detail, and shows where the problem is", async () => {
    renderForm();
    type(field("Name"), "   ");
    type(field("Username"), "ad");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Some fields need attention"));
    expect(field("Name").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Enter your name")).toBeTruthy();
    expect(screen.getByText("Username must be at least 3 characters")).toBeTruthy();
    expect(updateUser).not.toHaveBeenCalled();

    clickRibbon("Show problems");
    expect(document.activeElement).toBe(field("Name"));

    type(field("Name"), "Ada Lovelace");
    type(field("Username"), "ada");
    await waitFor(() => expect(ribbonTitle()).toBe("1 unsaved change"));
  });

  it("requires the current password to change the username, and shows where it goes", async () => {
    renderForm();
    type(field("Username"), "ada.king");

    clickRibbon("Save");

    expect(await screen.findByText("Enter your current password")).toBeTruthy();
    expect(ribbonTitle()).toBe("Some fields need attention");
    expect(updateUser).not.toHaveBeenCalled();

    clickRibbon("Show problems");
    expect(document.activeElement).toBe(field("Current password"));
  });

  it("sends a changed username, normalized, with the current password, then clears it", async () => {
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
    expect(queryPassword()).toBeNull();

    type(field("Email"), "ada@example.org");
    expect(field("Current password").value).toBe("");
  });

  it("changes the email with the current password", async () => {
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

  it("saves every changed detail with its own request", async () => {
    updateUser.mockResolvedValue({ error: null });
    changeEmail.mockResolvedValue({ error: null });
    const { onSaved } = renderForm();
    type(field("Name"), "Ada Lovelace");
    type(field("Username"), "ada.king");
    type(field("Email"), "ada@example.org");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser.mock.calls).toEqual([
      [{ name: "Ada Lovelace" }],
      [{ username: "ada.king", fetchOptions: reauthentication }],
    ]);
    expect(changeEmail).toHaveBeenCalledExactlyOnceWith({
      newEmail: "ada@example.org",
      fetchOptions: reauthentication,
    });
    expect(onSaved).toHaveBeenCalledOnce();
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

  it("keeps the sign-in details pending when only the name was saved", async () => {
    updateUser.mockImplementation((body) =>
      Promise.resolve(
        body !== null && typeof body === "object" && "username" in body
          ? { error: { status: 400, code: "INVALID_PASSWORD", message: "Invalid password" } }
          : { error: null },
      ),
    );
    renderForm();
    type(field("Name"), "Ada Lovelace");
    type(field("Username"), "ada.king");
    type(field("Email"), "ada@example.org");
    type(field("Current password"), "incorrect horse battery");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Some changes couldn’t be saved"));
    expect(ribbonDescription()).toBe(
      "Your name was updated, but not your username or email. Your current password is incorrect.",
    );
    expect(changeEmail).not.toHaveBeenCalled();
    expect(ribbonTitle()).toBe("Some changes couldn’t be saved");

    // The saved name is the new baseline, so discarding keeps it.
    clickRibbon("Discard");
    expect(field("Name").value).toBe("Ada Lovelace");
    expect(field("Username").value).toBe("ada");
    expect(field("Email").value).toBe("ada@example.com");
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
    expect(field("Current password").value).toBe("incorrect horse battery");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("keeps the change after a failed save, and saves it on retry", async () => {
    updateUser.mockResolvedValueOnce({ error: { status: 429 } });
    const { onSaved } = renderForm();
    type(field("Name"), "Ada Lovelace");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Couldn’t save your changes"));
    expect(ribbonDescription()).toContain("Too many attempts");
    expect(field("Name").value).toBe("Ada Lovelace");
    expect(onSaved).not.toHaveBeenCalled();

    updateUser.mockResolvedValueOnce({ error: null });
    clickRibbon("Retry");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledTimes(2);
  });

  it("discards changes and the current password", () => {
    renderForm();
    type(field("Name"), "Ada Lovelace");
    type(field("Username"), "ada.king");
    type(field("Current password"), "correct horse battery");

    clickRibbon("Discard");

    expect(field("Name").value).toBe("Ada");
    expect(field("Username").value).toBe("ada");
    expect(queryPassword()).toBeNull();
    expect(queryRibbon()).toBeNull();

    type(field("Username"), "ada.king");
    expect(field("Current password").value).toBe("");
  });

  it("discards back to the last saved details", async () => {
    updateUser.mockResolvedValue({ error: null });
    renderForm();
    type(field("Name"), "Ada Lovelace");
    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));

    type(field("Name"), "Ada King");
    clickRibbon("Discard");

    expect(field("Name").value).toBe("Ada Lovelace");
    expect(queryRibbon()).toBeNull();
  });

  it("sends nothing when a change only differs in case from the saved email", async () => {
    renderForm();
    type(field("Email"), "Ada@Example.com");

    expect(queryPassword()).toBeNull();
    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(changeEmail).not.toHaveBeenCalled();
    expect(field("Email").value).toBe("ada@example.com");
  });
});
