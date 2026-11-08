// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ServerIcon } from "lucide-react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SaveRibbon,
  SaveRibbonAction,
  SaveRibbonActions,
  SaveRibbonContent,
  SaveRibbonDescription,
  SaveRibbonDiscard,
  SaveRibbonIndicator,
  SaveRibbonSave,
  SaveRibbonScope,
  SaveRibbonTitle,
  type SaveRibbonProps,
  type SaveRibbonState,
} from "#ui/components/ui/save-ribbon";

beforeEach(() => {
  stubReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function deferred() {
  return Promise.withResolvers<void>();
}

function Contents({ status, error }: Pick<SaveRibbonState, "status" | "error">) {
  return (
    <>
      <SaveRibbonIndicator />
      <SaveRibbonContent>
        <SaveRibbonTitle>
          {status === "saved"
            ? "Changes saved"
            : status === "saving"
              ? "Saving…"
              : status === "error"
                ? "Couldn't save"
                : "2 unsaved changes"}
        </SaveRibbonTitle>
        {status === "error" && error instanceof Error && (
          <SaveRibbonDescription>{error.message}</SaveRibbonDescription>
        )}
      </SaveRibbonContent>
      {status !== "saved" && (
        <SaveRibbonActions>
          <SaveRibbonDiscard />
          <SaveRibbonSave>{status === "error" ? "Retry" : "Save"}</SaveRibbonSave>
        </SaveRibbonActions>
      )}
    </>
  );
}

function renderRibbon(props: SaveRibbonProps = {}) {
  const view = render(
    <SaveRibbon {...props}>
      {({ status, error }) => <Contents status={status} error={error} />}
    </SaveRibbon>,
  );
  return {
    ...view,
    rerender: (next: SaveRibbonProps) =>
      view.rerender(
        <SaveRibbon {...next}>
          {({ status, error }) => <Contents status={status} error={error} />}
        </SaveRibbon>,
      ),
  };
}

// A consumer with one field, which updates its saved baseline once the save succeeds.
function NameForm({
  saveName,
  ...props
}: Omit<SaveRibbonProps, "dirty" | "onSave" | "onDiscard"> & {
  saveName: (name: string) => Promise<void>;
}) {
  const [savedName, setSavedName] = React.useState("Alcove");
  const [name, setName] = React.useState(savedName);

  return (
    <>
      <input aria-label="Name" value={name} onChange={(event) => setName(event.target.value)} />
      <SaveRibbon
        dirty={name !== savedName}
        onSave={async () => {
          await saveName(name);
          setSavedName(name);
        }}
        onDiscard={() => setName(savedName)}
        {...props}
      >
        {({ status, error }) => <Contents status={status} error={error} />}
      </SaveRibbon>
    </>
  );
}

const surface = () => document.querySelector<HTMLElement>('[data-slot="save-ribbon-surface"]');
const politeRegion = () => document.querySelector('[aria-live="polite"]');
const assertiveRegion = () => document.querySelector('[aria-live="assertive"]');

// happy-dom runs animations on its own clock, which fake timers don't control.
function wait(milliseconds: number) {
  return act(() => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
}

async function flush() {
  await act(async () => {});
}

describe("SaveRibbon", () => {
  it("composes its parts into a named region", () => {
    render(
      <SaveRibbon dirty>
        <SaveRibbonIndicator />
        <SaveRibbonContent>
          <SaveRibbonTitle>
            3 unsaved changes
            <SaveRibbonScope>
              <ServerIcon />
              Applies to everyone
            </SaveRibbonScope>
          </SaveRibbonTitle>
          <SaveRibbonDescription>
            The installation name changes for every user.
          </SaveRibbonDescription>
        </SaveRibbonContent>
        <SaveRibbonActions>
          <SaveRibbonAction variant="ghost">Review</SaveRibbonAction>
          <SaveRibbonDiscard />
          <SaveRibbonSave />
        </SaveRibbonActions>
      </SaveRibbon>,
    );

    const region = screen.getByRole("region", { name: /3 unsaved changes/ });
    expect(region.dataset.status).toBe("unsaved");
    expect(region.getAttribute("aria-busy")).toBe("false");
    expect(
      region.querySelector('[data-slot="save-ribbon-indicator"]')?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(screen.getByText("Applies to everyone").dataset.slot).toBe("save-ribbon-scope");
    expect(screen.getByRole("button", { name: "Review" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  it("shows while there are unsaved changes, without taking focus", async () => {
    stubReducedMotion(true);
    const view = renderRibbon({ dirty: false });
    expect(surface()).toBeNull();

    const field = document.createElement("input");
    document.body.append(field);
    field.focus();
    view.rerender({ dirty: true });
    expect(surface()).not.toBeNull();
    expect(document.activeElement).toBe(field);

    view.rerender({ dirty: false });
    expect(surface()).toBeNull();
    field.remove();
  });

  it("follows an explicit open state over dirty", () => {
    stubReducedMotion(true);
    const view = renderRibbon({ dirty: false, open: true });
    expect(surface()).not.toBeNull();

    view.rerender({ dirty: true, open: false });
    expect(surface()).toBeNull();
  });

  it("shows the status it is given over the one it derives", () => {
    renderRibbon({ dirty: true, status: "conflict" });

    expect(surface()?.dataset.status).toBe("conflict");
    expect(
      document.querySelector('[data-slot="save-ribbon-indicator"]')?.getAttribute("data-status"),
    ).toBe("conflict");
  });

  it("calls onDiscard", () => {
    const onDiscard = vi.fn<() => void>();
    renderRibbon({ dirty: true, onDiscard });

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("saves asynchronously, ignoring further saves and discards until it settles", async () => {
    const pending = deferred();
    const saveName = vi.fn<(name: string) => Promise<void>>(() => pending.promise);
    render(<NameForm saveName={saveName} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Home" } });

    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(saveName).toHaveBeenCalledOnce();
    expect(saveName).toHaveBeenCalledWith("Home");

    expect(surface()?.dataset.status).toBe("saving");
    expect(surface()?.getAttribute("aria-busy")).toBe("true");
    expect(save.getAttribute("aria-disabled")).toBe("true");
    expect(save.dataset.pending).toBeDefined();
    const discard = screen.getByRole("button", { name: "Discard" });
    expect(discard.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(discard);
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Home");

    await act(async () => pending.resolve());
    expect(surface()?.dataset.status).toBe("saved");
    expect(surface()?.dataset.compact).toBeDefined();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("treats a save that returns false as not saved", async () => {
    const onSave = vi.fn<() => boolean>(() => false);
    renderRibbon({ dirty: true, onSave });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(onSave).toHaveBeenCalledOnce();
    expect(surface()?.dataset.status).toBe("unsaved");
  });

  it("dismisses the saved status after 2.5 seconds", async () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    const onDismiss = vi.fn<() => void>();
    render(<NameForm saveName={() => Promise.resolve()} onDismiss={onDismiss} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Home" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(surface()?.dataset.status).toBe("saved");

    act(() => vi.advanceTimersByTime(2499));
    expect(surface()).not.toBeNull();
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(surface()).toBeNull();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("returns from saved to unsaved on a new edit, as the same ribbon", async () => {
    vi.useFakeTimers();
    render(<NameForm saveName={() => Promise.resolve()} />);
    const field = screen.getByLabelText("Name");
    fireEvent.change(field, { target: { value: "Home" } });
    const ribbon = surface();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(surface()?.dataset.status).toBe("saved");

    act(() => vi.advanceTimersByTime(1000));
    fireEvent.change(field, { target: { value: "Home 2" } });
    expect(surface()).toBe(ribbon);
    expect(surface()?.dataset.status).toBe("unsaved");
    expect(surface()?.dataset.compact).toBeUndefined();

    // The dismissal was cancelled with the saved status.
    act(() => vi.advanceTimersByTime(5000));
    expect(surface()).toBe(ribbon);
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  it("shows edits made while saving as unsaved once the save resolves", async () => {
    const pending = deferred();
    render(<NameForm saveName={() => pending.promise} />);
    const field = screen.getByLabelText("Name");
    fireEvent.change(field, { target: { value: "Home" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.change(field, { target: { value: "Home 2" } });

    await act(async () => pending.resolve());
    expect(surface()?.dataset.status).toBe("unsaved");
  });

  it("keeps the changes pending when a save fails, and can retry", async () => {
    const saveName = vi
      .fn<(name: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("The server is unreachable."))
      .mockResolvedValueOnce();
    render(<NameForm saveName={saveName} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Home" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();

    expect(surface()?.dataset.status).toBe("error");
    expect(screen.getByText("The server is unreachable.")).toBeDefined();
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Home");
    expect(screen.getByRole("button", { name: "Discard" }).getAttribute("aria-disabled")).not.toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await flush();
    expect(saveName).toHaveBeenCalledTimes(2);
    expect(surface()?.dataset.status).toBe("saved");
  });

  it("reports a save that throws synchronously as an error", async () => {
    renderRibbon({
      dirty: true,
      onSave: () => {
        throw new Error("Invalid");
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(surface()?.dataset.status).toBe("error");
  });

  it("stays mounted until its exit animation finishes", async () => {
    const view = renderRibbon({ dirty: true });
    const ribbon = surface();

    view.rerender({ dirty: false });
    expect(surface()).toBe(ribbon);
    expect(ribbon?.dataset.state).toBe("closing");
    expect(ribbon?.inert).toBe(true);
    // Hiding shows the ribbon as it was, even if the status changed.
    expect(ribbon?.dataset.status).toBe("unsaved");

    await waitFor(() => expect(surface()).toBeNull());
  });

  it("stays mounted when shown again during its exit", async () => {
    const view = renderRibbon({ dirty: true });
    const ribbon = surface();

    view.rerender({ dirty: false });
    await wait(80);
    view.rerender({ dirty: true });
    expect(surface()).toBe(ribbon);
    expect(ribbon?.dataset.state).toBe("open");

    await wait(300);
    expect(surface()).toBe(ribbon);
  });

  it("crossfades and morphs between the full and compact presentations", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const compact = this.dataset.compact !== undefined;
      return DOMRect.fromRect({ width: compact ? 160 : 600, height: compact ? 44 : 52 });
    });
    const animate = vi.spyOn(HTMLElement.prototype, "animate");
    render(<NameForm saveName={() => Promise.resolve()} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Home" } });
    await wait(250);
    animate.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(surface()?.dataset.status).toBe("saved");

    const ghost = document.querySelector<HTMLElement>('[data-slot="save-ribbon-ghost"]');
    expect(ghost?.getAttribute("aria-hidden")).toBe("true");
    expect(ghost?.inert).toBe(true);
    // The outgoing copy is the saving presentation.
    expect(ghost?.textContent).toContain("Saving…");
    expect(ghost?.querySelector("[id]")).toBeNull();
    expect(animate).toHaveBeenCalledWith(
      [
        { width: "600px", height: "52px" },
        { width: "160px", height: "44px" },
      ],
      expect.objectContaining({ duration: 280 }),
    );

    await waitFor(() =>
      expect(document.querySelector('[data-slot="save-ribbon-ghost"]')).toBeNull(),
    );
    expect(
      document.querySelector<HTMLElement>('[data-slot="save-ribbon-body"]')?.getAttribute("style"),
    ).toBeNull();
  });

  it("skips movement and morphing when reduced motion is requested", async () => {
    stubReducedMotion(true);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const compact = this.dataset.compact !== undefined;
      return DOMRect.fromRect({ width: compact ? 160 : 600, height: compact ? 44 : 52 });
    });
    const animate = vi.spyOn(HTMLElement.prototype, "animate");
    render(<NameForm saveName={() => Promise.resolve()} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Home" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();

    expect(surface()?.dataset.status).toBe("saved");
    expect(document.querySelector('[data-slot="save-ribbon-ghost"]')).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });

  it("announces status changes politely, and problems assertively", async () => {
    const pending = deferred();
    const view = renderRibbon({ dirty: true, onSave: () => pending.promise });
    await flush();
    expect(politeRegion()?.textContent).toBe("2 unsaved changes");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(politeRegion()?.textContent).toBe("Saving…");

    await act(async () => pending.reject(new Error("The server is unreachable.")));
    expect(assertiveRegion()?.textContent).toBe("Couldn't save. The server is unreachable.");
    expect(politeRegion()?.textContent).toBe("");

    // Updating the contents without changing the status announces nothing new.
    view.rerender({ dirty: true, onSave: () => pending.promise });
    await flush();
    expect(assertiveRegion()?.textContent).toBe("Couldn't save. The server is unreachable.");

    view.rerender({ dirty: true, status: "conflict" });
    await flush();
    expect(assertiveRegion()?.textContent).toBe("2 unsaved changes");
  });

  it("moves focus to the ribbon when the focused Save button disappears", async () => {
    render(<NameForm saveName={() => Promise.resolve()} />);
    const field = screen.getByLabelText("Name");
    field.focus();
    fireEvent.change(field, { target: { value: "Home" } });

    const save = screen.getByRole("button", { name: "Save" });
    act(() => save.focus());
    fireEvent.click(save);
    await flush();

    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(document.activeElement).toBe(surface());
  });

  it("cleans up timers and ignores saves that settle after unmounting", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error");
    const pending = deferred();
    const onSave = vi.fn<() => Promise<void>>(() => pending.promise);
    const view = renderRibbon({ dirty: true, onSave });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    view.unmount();
    await act(async () => pending.resolve());
    expect(vi.getTimerCount()).toBe(0);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("clears the saved dismissal timer on unmount", async () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    const onDismiss = vi.fn<() => void>();
    const view = render(<NameForm saveName={() => Promise.resolve()} onDismiss={onDismiss} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Home" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();

    view.unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
