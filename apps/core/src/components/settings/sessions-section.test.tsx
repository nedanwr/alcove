// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountSession } from "~/auth/auth-state";
import { SessionsSection } from "~/components/settings/sessions-section";

const revokeSession = vi.hoisted(() => vi.fn<(input: unknown) => Promise<void>>());
const revokeOtherSessions = vi.hoisted(() => vi.fn<() => Promise<void>>());
vi.mock("~/auth/sessions.functions", () => ({ revokeSession, revokeOtherSessions }));

const day = 24 * 60 * 60 * 1000;

function accountSession(id: string, userAgent: string, current = false): AccountSession {
  const createdAt = new Date(Date.UTC(2026, 9, 20, 9));
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    expiresAt: new Date(createdAt.getTime() + 7 * day),
    ipAddress: "203.0.113.7",
    userAgent,
    current,
  };
}

const sessions = [
  accountSession(
    "current",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    true,
  ),
  accountSession(
    "phone",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  ),
];

function renderSection(list: readonly AccountSession[] = sessions) {
  const onChanged = vi.fn<() => Promise<void>>(() => Promise.resolve());
  render(<SessionsSection sessions={list} onChanged={onChanged} />);
  return {
    onChanged,
    items: () => within(screen.getByRole("list", { name: "Sessions" })).getAllByRole("listitem"),
  };
}

describe("SessionsSection", () => {
  beforeEach(() => {
    revokeSession.mockReset();
    revokeOtherSessions.mockReset();
  });

  afterEach(cleanup);

  it("describes each session and marks the current one, which can't be signed out here", () => {
    const { items } = renderSection();
    const [current, phone] = items();

    expect(current?.textContent).toContain("Chrome on macOS");
    expect(current?.textContent).toContain("This session");
    expect(current?.querySelector("button")).toBeNull();
    expect(phone?.textContent).toContain("Chrome on Android");
    expect(phone?.textContent).toContain("203.0.113.7");
  });

  it("signs out another session by its ID", async () => {
    revokeSession.mockResolvedValue();
    const { onChanged } = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Sign out Chrome on Android" }));

    expect((await screen.findByRole("status")).textContent).toContain(
      "Chrome on Android was signed out.",
    );
    expect(revokeSession).toHaveBeenCalledWith({ data: { id: "phone" } });
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("signs out every other session", async () => {
    revokeOtherSessions.mockResolvedValue();
    const { onChanged } = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Sign out other sessions" }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    expect(revokeOtherSessions).toHaveBeenCalledOnce();
  });

  it("disables signing out others when there are none", () => {
    renderSection(sessions.slice(0, 1));

    const button = screen.getByRole("button", { name: "Sign out other sessions" });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("shows the server's error", async () => {
    revokeSession.mockRejectedValue(new Error("Your session has ended. Sign in again."));
    const { onChanged } = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Sign out Chrome on Android" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Your session has ended.");
    expect(onChanged).not.toHaveBeenCalled();
  });
});
