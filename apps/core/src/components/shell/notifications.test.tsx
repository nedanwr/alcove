// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BoxIcon } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Notifications, type AppNotification } from "~/components/shell/notifications";

afterEach(cleanup);

const source = { title: "Module", icon: BoxIcon, tint: "#52525b" };

const notifications: AppNotification[] = [
  {
    id: "1",
    source,
    message: "First update",
    createdAt: new Date("2026-10-28T09:00:00Z"),
    unread: true,
  },
  {
    id: "2",
    source,
    message: "Second update",
    createdAt: new Date("2026-10-27T09:00:00Z"),
    unread: false,
  },
];

function Harness(props: { notifications: readonly AppNotification[]; onMarkAllRead?: () => void }) {
  const [open, setOpen] = useState(false);
  return <Notifications {...props} open={open} onOpenChange={setOpen} />;
}

async function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /^Notifications/ }));
  return within(await screen.findByRole("dialog", { name: "Notifications" }));
}

describe("Notifications", () => {
  it("shows an unread dot, and counts the unread ones in its name", () => {
    render(<Harness notifications={notifications} />);

    const button = screen.getByRole("button", { name: "Notifications, 1 unread" });
    expect(button.querySelector("[data-slot=notifications-unread]")).not.toBeNull();
  });

  it("lists each notification with its module, marking the unread ones", async () => {
    render(<Harness notifications={notifications} />);
    const panel = await openPanel();

    const rows = panel.getAllByRole("listitem");
    expect(rows.map((row) => within(row).queryByText("Unread") !== null)).toEqual([true, false]);
    expect(rows[0]?.textContent).toMatch(/^First updateModule · /);
  });

  it("marks everything read with the given action", async () => {
    const onMarkAllRead = vi.fn<() => void>();
    render(<Harness notifications={notifications} onMarkAllRead={onMarkAllRead} />);
    const panel = await openPanel();

    fireEvent.click(panel.getByRole("button", { name: "Mark all read" }));

    expect(onMarkAllRead).toHaveBeenCalledOnce();
  });

  it.each([
    ["nothing is unread", notifications.filter((item) => !item.unread), vi.fn<() => void>()],
    ["there's no way to mark them", notifications, undefined],
  ])("leaves out Mark all read when %s", async (_, items, onMarkAllRead) => {
    render(<Harness notifications={items} {...(onMarkAllRead ? { onMarkAllRead } : {})} />);
    const panel = await openPanel();

    expect(panel.queryByRole("button", { name: "Mark all read" })).toBeNull();
  });

  it("closes on an outside click", async () => {
    render(<Harness notifications={[]} />);
    await openPanel();

    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
