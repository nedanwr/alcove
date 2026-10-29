// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Input } from "@alcove/ui/components/ui/input";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePendingChanges } from "~/components/settings/settings-changes";
import { SettingsLayout, SettingsPageHeader } from "~/components/settings/settings-layout";
import { SettingsField, SettingsRow } from "~/components/settings/settings-row";
import { SettingsSection } from "~/components/settings/settings-section";
import { stubReducedMotion } from "~/components/settings/testing";

vi.mock("@tanstack/react-router", () => ({ useBlocker: () => {} }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function PendingSection() {
  usePendingChanges({
    changes: 1,
    invalid: false,
    save: async () => ({ status: "saved" }),
    discard: () => {},
    focusFirstInvalidField: () => {},
  });
  return (
    <SettingsSection title="Profile" description="How you appear to other people.">
      <SettingsRow>
        <div>Name</div>
        <div>Ada</div>
      </SettingsRow>
    </SettingsSection>
  );
}

describe("SettingsLayout", () => {
  it("puts every page in one column, with the save ribbon after it in the scroll area", () => {
    stubReducedMotion();
    render(
      <SettingsLayout>
        <SettingsPageHeader title="Profile" description="How you appear on Alcove" />
        <PendingSection />
      </SettingsLayout>,
    );

    const area = document.querySelector('[data-slot="settings-scroll-area"]');
    const column = document.querySelector('[data-slot="settings-column"]');
    const ribbon = document.querySelector('[data-slot="save-ribbon"]');
    expect(column?.parentElement).toBe(area);
    // The ribbon sticks to the bottom of the scroll area only as its child, after the column.
    expect(ribbon?.parentElement).toBe(area);
    expect(column?.compareDocumentPosition(ribbon ?? document.body)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(column?.contains(screen.getByRole("heading", { level: 2, name: "Profile" }))).toBe(true);
  });
});

describe("SettingsSection", () => {
  it("names its region with its heading, above the panel", () => {
    render(
      <SettingsSection title="Sign-in details" description="You sign in with your username.">
        <p>Panel</p>
      </SettingsSection>,
    );

    const region = screen.getByRole("region", { name: "Sign-in details" });
    const heading = screen.getByRole("heading", { level: 3, name: "Sign-in details" });
    expect(region.contains(heading)).toBe(true);
    expect(document.querySelector('[data-slot="card"]')?.contains(heading)).toBe(false);
  });
});

function renderField(error: string | undefined) {
  render(
    <SettingsField
      label="Username"
      name="username"
      description="Letters and numbers."
      error={error}
    >
      {(control) => <Input {...control} defaultValue="ada" />}
    </SettingsField>,
  );
  return screen.getByLabelText<HTMLInputElement>("Username");
}

describe("SettingsField", () => {
  it("labels and describes its input", () => {
    const input = renderField(undefined);

    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBe("username-description");
    expect(document.getElementById("username-description")?.textContent).toBe(
      "Letters and numbers.",
    );
  });

  it("announces its error alongside the description", () => {
    const input = renderField("That username is taken.");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("username-description username-error");
    expect(screen.getByRole("alert").textContent).toBe("That username is taken.");
  });
});
