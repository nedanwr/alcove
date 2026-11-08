// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppearanceSettings } from "~/components/settings/appearance-settings";
import { SettingsChanges } from "~/components/settings/settings-changes";
import { queryRibbon } from "~/components/settings/testing";
import { ThemeProvider } from "~/components/theme-provider";

vi.mock("@tanstack/react-router", () => ({ ScriptOnce: () => null, useBlocker: () => {} }));

/** A device whose colour scheme can change, and which asks for reduced motion. */
function stubDevice({ dark }: { dark: boolean }) {
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      if (query.includes("prefers-color-scheme: dark")) return dark;
      return query.includes("prefers-reduced-motion");
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }));

  return {
    setDark(next: boolean) {
      dark = next;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

function renderPage() {
  return render(
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <SettingsChanges>
        <AppearanceSettings />
      </SettingsChanges>
    </ThemeProvider>,
  );
}

function group(name: string) {
  return screen.getByRole("radiogroup", { name });
}

function radio(name: string) {
  return screen.getByRole("radio", { name });
}

function checked(element: HTMLElement) {
  return element.getAttribute("aria-checked") === "true";
}

/** The text that describes a control, such as why it can’t be changed yet. */
function note(element: HTMLElement) {
  const ids = element.getAttribute("aria-describedby")?.split(" ") ?? [];
  return ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
}

function appliedTheme() {
  const root = document.documentElement;
  return { classes: [...root.classList], colorScheme: root.style.colorScheme };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AppearanceSettings", () => {
  it("shows the page's heading, its scope, and five settings in one panel", () => {
    stubDevice({ dark: false });
    renderPage();

    expect(screen.getByRole("heading", { level: 2, name: "Appearance" })).toBeTruthy();
    expect(screen.getByText("Customize how Alcove looks and feels.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Only you/ })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/sync|devices you use|every device/i);

    const panels = document.querySelectorAll('[data-slot="card"]');
    expect(panels).toHaveLength(1);
    const rows = panels[0]?.querySelectorAll('[data-slot="settings-row"]') ?? [];
    expect([...rows].map((row) => row.firstElementChild?.firstElementChild?.textContent)).toEqual([
      "Theme",
      "Accent colour",
      "Density",
      "Open to",
      "Reduce motion",
    ]);
  });

  describe("theme", () => {
    it("matches the device by default", () => {
      stubDevice({ dark: true });
      renderPage();

      const options = within(group("Theme")).getAllByRole("radio");
      expect(options.map((option) => option.textContent)).toEqual([
        "Light",
        "Dark",
        "Match device",
      ]);
      expect(options.filter(checked).map((option) => option.textContent)).toEqual(["Match device"]);
      expect(appliedTheme()).toEqual({ classes: ["dark"], colorScheme: "dark" });
    });

    it("applies a chosen theme at once and saves it in the browser", () => {
      stubDevice({ dark: false });
      renderPage();

      fireEvent.click(radio("Dark"));

      expect(checked(radio("Dark"))).toBe(true);
      expect(checked(radio("Match device"))).toBe(false);
      expect(appliedTheme()).toEqual({ classes: ["dark"], colorScheme: "dark" });
      expect(localStorage.getItem("theme")).toBe("dark");

      fireEvent.click(radio("Light"));

      expect(appliedTheme()).toEqual({ classes: ["light"], colorScheme: "light" });
      expect(localStorage.getItem("theme")).toBe("light");
      expect(queryRibbon()).toBeNull();
    });

    it("can be chosen with the arrow keys", async () => {
      stubDevice({ dark: false });
      renderPage();

      fireEvent.click(radio("Light"));
      act(() => radio("Light").focus());
      fireEvent.keyDown(radio("Light"), { key: "ArrowRight" });

      await waitFor(() => expect(checked(radio("Dark"))).toBe(true));
      expect(document.activeElement).toBe(radio("Dark"));
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("restores the saved theme", () => {
      localStorage.setItem("theme", "dark");
      stubDevice({ dark: false });
      renderPage();

      expect(checked(radio("Dark"))).toBe(true);
      expect(appliedTheme()).toEqual({ classes: ["dark"], colorScheme: "dark" });
    });

    it("follows the device's colour scheme while matching it", () => {
      const device = stubDevice({ dark: false });
      renderPage();
      expect(appliedTheme().classes).toEqual(["light"]);

      device.setDark(true);
      expect(appliedTheme()).toEqual({ classes: ["dark"], colorScheme: "dark" });

      fireEvent.click(radio("Light"));
      device.setDark(false);
      device.setDark(true);
      expect(appliedTheme().classes).toEqual(["light"]);
    });
  });

  describe("unavailable preferences", () => {
    beforeEach(() => {
      stubDevice({ dark: false });
      renderPage();
    });

    it("explains which preferences are coming later", () => {
      expect(screen.getByText(/^Coming later:/).parentElement?.textContent).toMatch(
        /accent colour, density, where Alcove opens, and a reduce-motion switch can’t be changed yet\. Alcove already reduces motion when your device asks it to\./,
      );
      expect(note(group("Theme"))).toBe("");
    });

    it("shows the accent colours, with teal as the default, without letting one be chosen", () => {
      const accent = group("Accent colour");
      const swatches = within(accent).getAllByRole("radio");

      expect(accent.getAttribute("aria-disabled")).toBe("true");
      expect(note(accent)).toMatch(/^Used for buttons, selections, and focus indicators\. Coming/);
      expect(swatches.map((swatch) => swatch.getAttribute("aria-label"))).toEqual([
        "Teal",
        "Blue",
        "Violet",
        "Amber",
        "Rose",
      ]);
      expect(swatches.filter(checked).map((swatch) => swatch.getAttribute("aria-label"))).toEqual([
        "Teal",
      ]);
      expect(radio("Teal").querySelector("svg")).toBeTruthy();

      fireEvent.click(radio("Violet"));

      expect(checked(radio("Teal"))).toBe(true);
      expect(checked(radio("Violet"))).toBe(false);
      expect(document.documentElement.getAttribute("style")).not.toContain("--");
    });

    it("keeps density comfortable", () => {
      const density = group("Density");

      expect(density.getAttribute("aria-disabled")).toBe("true");
      expect(note(density)).toMatch(/^Compact fits more rows in lists and tables\. Coming/);
      expect(checked(radio("Comfortable"))).toBe(true);

      fireEvent.click(radio("Compact"));

      expect(checked(radio("Comfortable"))).toBe(true);
      expect(checked(radio("Compact"))).toBe(false);
    });

    it("keeps Home as the place Alcove opens to", () => {
      const select = screen.getByRole("combobox", { name: "Open to" });

      expect(
        select.hasAttribute("disabled") || select.getAttribute("aria-disabled") === "true",
      ).toBe(true);
      expect(select.querySelector('[data-slot="select-value"]')?.textContent).toBe("Home");
      expect(note(select)).toMatch(/^Coming later/);

      fireEvent.click(select);

      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("keeps the reduce-motion switch off and disabled", () => {
      const control = screen.getByRole("switch", { name: "Reduce motion" });

      expect(control.getAttribute("aria-checked")).toBe("false");
      expect(control.getAttribute("aria-disabled")).toBe("true");
      expect(note(control)).toMatch(/Also follows your device settings\. Coming later/);

      fireEvent.click(control);

      expect(control.getAttribute("aria-checked")).toBe("false");
    });

    it("saves nothing but the theme", () => {
      for (const name of ["Blue", "Compact"]) fireEvent.click(radio(name));
      fireEvent.click(screen.getByRole("switch", { name: "Reduce motion" }));

      expect(localStorage.length).toBe(0);
      expect(queryRibbon()).toBeNull();
    });
  });
});
