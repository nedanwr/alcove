// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SecuritySettings } from "~/components/settings/security-settings";
import { queryRibbon, renderSettingsPage } from "~/components/settings/testing";

const authClient = vi.hoisted(() => ({ changePassword: vi.fn<() => Promise<unknown>>() }));
vi.mock("~/auth/auth-client", () => ({ authClient }));

const user = {
  id: "user-1",
  name: "Ada Lovelace",
  username: "lovelace",
  email: "ada@example.com",
  image: null,
  administrator: true,
};

function region(name: string) {
  return within(screen.getByRole("region", { name }));
}

describe("SecuritySettings", () => {
  beforeEach(() => {
    renderSettingsPage(<SecuritySettings user={user} onChanged={() => Promise.resolve()} />);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the page's heading, its scope, and three sections in order", () => {
    expect(screen.getByRole("heading", { level: 2, name: "Sign-in & security" })).toBeTruthy();
    expect(screen.getByText("Manage your password and sign-in security.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Only you/ })).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["Password", "Two-factor authentication", "Sign-in alerts"]);
  });

  it("shows two-factor methods as information, without anything to act on", () => {
    const section = region("Two-factor authentication");

    expect(section.getByText("Authenticator app")).toBeTruthy();
    expect(section.getByText("Passkeys")).toBeTruthy();
    expect(section.getByText("Recovery codes")).toBeTruthy();
    expect(section.getAllByText("Not set up")).toHaveLength(1);
    expect(section.getAllByText("Not available yet")).toHaveLength(2);
    expect(section.getByText(/isn’t available in Alcove yet/)).toBeTruthy();
    expect(section.queryByRole("button")).toBeNull();
    expect(section.queryByRole("link")).toBeNull();
  });

  it("doesn't imply that any method is on or was ever used", () => {
    expect(document.body.textContent).not.toMatch(/\bOn\b|Enabled|Last used|Added|Registered/);
  });

  it("keeps sign-in alerts off, disabled, and unsaved", () => {
    const section = region("Sign-in alerts");
    const switches = [
      "Email me when a new device signs in",
      "Email me after repeated failed sign-ins",
    ].map((name) => section.getByRole("switch", { name }));

    expect(section.getByText(/^Not available yet\./)).toBeTruthy();
    for (const control of switches) {
      expect(control.getAttribute("aria-checked")).toBe("false");
      expect(control.getAttribute("aria-disabled")).toBe("true");

      fireEvent.click(control);

      expect(control.getAttribute("aria-checked")).toBe("false");
    }
    expect(queryRibbon()).toBeNull();
  });
});
