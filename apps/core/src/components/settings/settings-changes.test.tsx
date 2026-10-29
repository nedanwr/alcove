// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InstallationForm } from "~/components/settings/installation-form";
import { PersonalDetailsForm } from "~/components/settings/personal-details-form";
import { SettingsLayout } from "~/components/settings/settings-layout";
import {
  clickRibbon,
  field,
  queryRibbon,
  renderSettingsPage,
  ribbon,
  ribbonDescription,
  ribbonTitle,
  stubReducedMotion,
  type,
} from "~/components/settings/testing";

type Result = { error: { status: number; code?: string; message?: string } | null };

const updateUser = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
const changeEmail = vi.hoisted(() => vi.fn<(body: unknown) => Promise<Result>>());
const updateInstallationSettings = vi.hoisted(() => vi.fn<(body: unknown) => Promise<void>>());
vi.mock("~/auth/auth-client", () => ({ authClient: { updateUser, changeEmail } }));
vi.mock("~/installation.functions", () => ({ updateInstallationSettings }));

const details = { name: "Ada", email: "ada@example.com", username: "ada" };

// Two independent sections, each with its own form, baseline, and operation.
function renderSectionsPage() {
  const onSaved = vi.fn<() => Promise<void>>(() => Promise.resolve());
  renderSettingsPage(
    <>
      <PersonalDetailsForm details={details} onSaved={onSaved} />
      <InstallationForm name="Alcove" onSaved={onSaved} />
    </>,
  );
  return { onSaved };
}

// Both sections have a field named `name`, so find each within its own section.
function personalName() {
  const section = within(screen.getByRole("region", { name: "Personal details" }));
  return section.getByRole<HTMLInputElement>("textbox", { name: /^Name/ });
}

function installationName() {
  return within(screen.getByRole("region", { name: "General" })).getByRole<HTMLInputElement>(
    "textbox",
  );
}

function editBothSections() {
  type(personalName(), "Ada Lovelace");
  type(installationName(), "Home server");
}

describe("SettingsChanges", () => {
  beforeEach(() => {
    updateUser.mockReset();
    changeEmail.mockReset();
    updateInstallationSettings.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows one ribbon for the changes in every section of the page", () => {
    renderSectionsPage();

    editBothSections();

    expect(document.querySelectorAll('[data-slot="save-ribbon-surface"]')).toHaveLength(1);
    expect(ribbonTitle()).toMatch(/^2 unsaved changes/);
  });

  it("saves every changed section with its own operation", async () => {
    updateUser.mockResolvedValue({ error: null });
    updateInstallationSettings.mockResolvedValue();
    renderSectionsPage();
    editBothSections();

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Ada Lovelace" });
    expect(updateInstallationSettings).toHaveBeenCalledExactlyOnceWith({
      data: { name: "Home server" },
    });
  });

  it("saves only the sections with changes", async () => {
    updateUser.mockResolvedValue({ error: null });
    renderSectionsPage();
    type(personalName(), "Ada Lovelace");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Ada Lovelace" });
    expect(updateInstallationSettings).not.toHaveBeenCalled();
  });

  it("keeps only the failed section's changes pending when another section saves", async () => {
    updateUser.mockResolvedValue({ error: null });
    updateInstallationSettings.mockRejectedValue(new Error("Installation unavailable"));
    renderSectionsPage();
    editBothSections();

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toMatch(/^Some changes couldn’t be saved/));
    expect(ribbonDescription()).toBe("Installation unavailable");
    expect(ribbon().getByRole("button", { name: "Retry" })).toBeTruthy();

    // The saved name is the new baseline, so discarding keeps it.
    clickRibbon("Discard");
    expect(personalName().value).toBe("Ada Lovelace");
    expect(installationName().value).toBe("Alcove");
    expect(queryRibbon()).toBeNull();
  });

  it("reports an error, not a partial save, when every section fails", async () => {
    updateUser.mockResolvedValue({ error: { status: 500, message: "Server unavailable" } });
    updateInstallationSettings.mockRejectedValue(new Error("Server unavailable"));
    renderSectionsPage();
    editBothSections();

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toMatch(/^Couldn’t save your changes/));
    expect(ribbonDescription()).toBe("Server unavailable Server unavailable");
    expect(personalName().value).toBe("Ada Lovelace");
    expect(installationName().value).toBe("Home server");
  });

  it("saves valid sections and asks for attention to invalid ones", async () => {
    updateUser.mockResolvedValue({ error: null });
    renderSectionsPage();
    type(personalName(), "Ada Lovelace");
    type(installationName(), " ");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toMatch(/^Some fields need attention/));
    expect(updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Ada Lovelace" });
    expect(updateInstallationSettings).not.toHaveBeenCalled();

    clickRibbon("Show problems");
    expect(document.activeElement).toBe(installationName());
  });

  it("discards every section's changes", () => {
    renderSectionsPage();
    editBothSections();

    clickRibbon("Discard");

    expect(personalName().value).toBe("Ada");
    expect(installationName().value).toBe("Alcove");
    expect(queryRibbon()).toBeNull();
  });

  it("dismisses the saved confirmation on its own", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    updateUser.mockResolvedValue({ error: null });
    renderSectionsPage();
    type(personalName(), "Ada Lovelace");

    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    await act(() => vi.advanceTimersByTimeAsync(2500));

    expect(queryRibbon()).toBeNull();
  });

  it("marks instance settings as applying to everyone", async () => {
    updateInstallationSettings.mockResolvedValue();
    renderSettingsPage(<InstallationForm name="Alcove" onSaved={() => Promise.resolve()} />);

    type(installationName(), " Home server ");
    expect(ribbon().getByText("Applies to everyone")).toBeTruthy();

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));
    expect(updateInstallationSettings).toHaveBeenCalledExactlyOnceWith({
      data: { name: "Home server" },
    });
  });

  it("keeps instance settings pending when the server rejects them", async () => {
    updateInstallationSettings.mockRejectedValue(new Error("Only administrators can do that."));
    renderSettingsPage(<InstallationForm name="Alcove" onSaved={() => Promise.resolve()} />);
    type(installationName(), "Home server");

    clickRibbon("Save");

    await waitFor(() => expect(ribbonTitle()).toMatch(/^Couldn’t save your changes/));
    expect(ribbonDescription()).toBe("Only administrators can do that.");
    expect(installationName().value).toBe("Home server");
  });
});

async function renderPages() {
  stubReducedMotion();
  const rootRoute = createRootRoute({
    component: () => (
      <SettingsLayout>
        <Outlet />
      </SettingsLayout>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/settings/account",
        component: () => (
          <PersonalDetailsForm details={details} onSaved={() => Promise.resolve()} />
        ),
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/settings/devices",
        component: () => <p>Devices</p>,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/settings/account"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByLabelText("Name");
  return {
    router,
    // Not awaited: a blocked navigation never settles.
    navigate: () => act(() => void router.navigate({ to: "/settings/devices" })),
  };
}

describe("UnsavedChangesGuard", () => {
  beforeEach(() => updateUser.mockReset());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lets people leave a page without changes", async () => {
    const confirm = vi.fn<() => boolean>(() => false);
    vi.stubGlobal("confirm", confirm);
    const { router, navigate } = await renderPages();

    await navigate();

    expect(confirm).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/settings/devices");
  });

  it("asks before leaving unsaved changes, and stays if declined", async () => {
    const confirm = vi.fn<() => boolean>(() => false);
    vi.stubGlobal("confirm", confirm);
    const { router, navigate } = await renderPages();
    type(field("Name"), "Ada Lovelace");

    await navigate();

    expect(confirm).toHaveBeenCalledOnce();
    expect(router.state.location.pathname).toBe("/settings/account");
    expect(field("Name").value).toBe("Ada Lovelace");
  });

  it("leaves when confirmed", async () => {
    vi.stubGlobal("confirm", () => true);
    const { router, navigate } = await renderPages();
    type(field("Name"), "Ada Lovelace");

    await navigate();

    await waitFor(() => expect(router.state.location.pathname).toBe("/settings/devices"));
    expect(queryRibbon()).toBeNull();
  });

  it("stops asking once the changes are saved", async () => {
    const confirm = vi.fn<() => boolean>(() => false);
    vi.stubGlobal("confirm", confirm);
    updateUser.mockResolvedValue({ error: null });
    const { router, navigate } = await renderPages();
    type(field("Name"), "Ada Lovelace");
    clickRibbon("Save");
    await waitFor(() => expect(ribbonTitle()).toBe("Changes saved"));

    await navigate();

    expect(confirm).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/settings/devices");
  });
});
