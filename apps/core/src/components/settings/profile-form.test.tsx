// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileForm } from "~/components/settings/profile-form";
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
vi.mock("~/auth/auth-client", () => ({ authClient: { updateUser } }));

function renderForm() {
  const onSaved = vi.fn<() => Promise<void>>(() => Promise.resolve());
  renderSettingsPage(<ProfileForm name="Ada" onSaved={onSaved} />);
  return { onSaved, input: field("Name") };
}

describe("ProfileForm", () => {
  beforeEach(() => updateUser.mockReset());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("has no save button of its own, and no ribbon until something changes", () => {
    const { input } = renderForm();
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(screen.queryByRole("button")).toBeNull();
    expect(queryRibbon()).toBeNull();
  });

  it("shows the ribbon for a change, and hides it when the change is undone", () => {
    const { input } = renderForm();

    type(input, "Ada Lovelace");
    expect(ribbonTitle()).toBe("1 unsaved change");

    type(input, "Ada");
    expect(queryRibbon()).toBeNull();
  });

  it("saves a trimmed name from the ribbon, then shows it as saved", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { input, onSaved } = renderForm();
    type(input, "  Ada Lovelace ");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Ada Lovelace" });
    expect(onSaved).toHaveBeenCalledOnce();
    expect(input.value).toBe("Ada Lovelace");
  });

  it("returns to unsaved when edited while showing the saved confirmation", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { input } = renderForm();
    type(input, "Ada Lovelace");
    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));

    type(input, "Ada King");

    expect(ribbonTitle()).toBe("1 unsaved change");
  });

  it("sends one request however often Save is pressed while saving", async () => {
    const { promise, resolve } = Promise.withResolvers<Result>();
    updateUser.mockReturnValue(promise);
    const { input } = renderForm();
    type(input, "Ada Lovelace");

    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Saving changes…"));
    clickRibbon("Save");
    resolve({ error: null });

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledOnce();
  });

  it("doesn't send an invalid name, and shows where the problem is", async () => {
    const { input } = renderForm();
    type(input, "   ");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Some fields need attention"));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(updateUser).not.toHaveBeenCalled();

    clickRibbon("Show problems");
    expect(document.activeElement).toBe(input);

    type(input, "Ada Lovelace");
    await waitFor(() => expect(ribbonTitle()).toBe("1 unsaved change"));
  });

  it("keeps the change after a failed save, and saves it on retry", async () => {
    updateUser.mockResolvedValueOnce({ error: { status: 429 } });
    const { input, onSaved } = renderForm();
    type(input, "Ada Lovelace");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Couldn’t save your changes"));
    expect(ribbonDescription()).toContain("Too many attempts");
    expect(input.value).toBe("Ada Lovelace");
    expect(onSaved).not.toHaveBeenCalled();

    updateUser.mockResolvedValueOnce({ error: null });
    clickRibbon("Retry");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledTimes(2);
  });

  it("discards back to the last saved name", async () => {
    updateUser.mockResolvedValue({ error: null });
    const { input } = renderForm();
    type(input, "Ada Lovelace");
    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));

    type(input, "Ada King");
    clickRibbon("Discard");

    expect(input.value).toBe("Ada Lovelace");
    expect(queryRibbon()).toBeNull();
  });
});
