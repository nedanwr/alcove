// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { queryRibbon, renderSettingsPage } from "~/components/settings/testing";
import { VisibilitySection } from "~/components/settings/visibility-section";

const updateUser = vi.hoisted(() => vi.fn<(body: unknown) => Promise<unknown>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { updateUser } }));

function selectedValue(trigger: HTMLElement) {
  return trigger.querySelector('[data-slot="select-value"]')?.textContent;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VisibilitySection", () => {
  it("says the preferences aren't available yet", () => {
    renderSettingsPage(<VisibilitySection />);

    const section = screen.getByRole("region", { name: "Visibility" });
    expect(section.textContent).toContain("Not available yet.");
    for (const name of ["Who can find you", "Who can see your email"]) {
      expect(selectedValue(screen.getByRole("combobox", { name }))).toBe("Not available yet");
    }
  });

  it("previews the intended options without letting them be chosen or saved", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal("fetch", fetch);
    renderSettingsPage(<VisibilitySection />);
    const trigger = screen.getByRole("combobox", { name: "Who can find you" });

    fireEvent.click(trigger);
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Everyone on this server",
      "Only people in my groups",
      "Only administrators",
    ]);
    for (const option of options) expect(option.getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(screen.getByRole("option", { name: "Only administrators" }));

    expect(selectedValue(trigger)).toBe("Not available yet");
    expect(queryRibbon()).toBeNull();
    expect(updateUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
