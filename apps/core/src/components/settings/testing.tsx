// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { SettingsChanges } from "~/components/settings/settings-changes";

/** Makes the save ribbon show and hide without waiting for animations. */
export function stubReducedMotion() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

export function renderSettingsPage(page: ReactNode) {
  stubReducedMotion();
  return render(<SettingsChanges>{page}</SettingsChanges>);
}

export function queryRibbon() {
  return document.querySelector<HTMLElement>('[data-slot="save-ribbon-surface"]');
}

export function ribbon() {
  const surface = queryRibbon();
  if (!surface) throw new Error("The save ribbon isn't showing.");
  return within(surface);
}

export function ribbonTitle() {
  return queryRibbon()?.querySelector('[data-slot="save-ribbon-title"]')?.textContent ?? null;
}

export function ribbonDescription() {
  return queryRibbon()?.querySelector('[data-slot="save-ribbon-description"]')?.textContent ?? null;
}

export function clickRibbon(name: string) {
  fireEvent.click(ribbon().getByRole("button", { name }));
}

export function field(label: string) {
  return screen.getByLabelText<HTMLInputElement>(label);
}

export function type(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}
