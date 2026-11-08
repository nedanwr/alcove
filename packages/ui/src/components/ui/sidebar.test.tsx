// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { InboxIcon, SendIcon } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderIcon,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTitle,
  SidebarTrigger,
} from "#ui/components/ui/sidebar";
import { TooltipProvider } from "#ui/components/ui/tooltip";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubScreen({ narrow }: { narrow: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: narrow,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderSidebar({ accent }: { accent?: string } = {}) {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        {/* The application header's trigger, which opens the drawer on small screens. */}
        <SidebarTrigger data-testid="header-trigger" />
        <Sidebar collapsible="icon" label="Mail" {...(accent ? { accent } : {})}>
          <SidebarHeader>
            <SidebarHeaderIcon>
              <InboxIcon />
            </SidebarHeaderIcon>
            <SidebarTitle>Mail</SidebarTitle>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <nav aria-label="Mail">
              <SidebarGroup>
                <SidebarGroupLabel>Folders</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive
                        tooltip="Inbox"
                        render={<a href="/inbox" aria-current="page" />}
                      >
                        <InboxIcon aria-hidden />
                        <span>Inbox</span>
                        <SidebarMenuBadge>3</SidebarMenuBadge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Sent" render={<a href="/sent" />}>
                        <SendIcon aria-hidden />
                        <span>Sent</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </nav>
            <p>Storage: 2 GB of 15 GB</p>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </TooltipProvider>,
  );
}

describe("Sidebar", () => {
  it("renders module content alongside navigation items", () => {
    stubScreen({ narrow: false });
    renderSidebar();

    const nav = within(screen.getByRole("navigation", { name: "Mail" }));
    expect(nav.getByRole("link", { name: "Inbox 3" }).getAttribute("aria-current")).toBe("page");
    expect(nav.getByRole("link", { name: "Sent" }).hasAttribute("data-active")).toBe(false);
    expect(screen.getByText("Storage: 2 GB of 15 GB")).toBeDefined();
  });

  it("collapses to icons that keep their names, and expands again", () => {
    stubScreen({ narrow: false });
    const { container } = renderSidebar();
    const sidebar = container.querySelector<HTMLElement>("[data-slot=sidebar]");
    if (!sidebar) throw new Error("Missing sidebar");
    const { getByRole } = within(sidebar);

    expect(sidebar.getAttribute("data-state")).toBe("expanded");
    fireEvent.click(getByRole("button", { name: "Collapse sidebar" }));

    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
    expect(sidebar.getAttribute("data-collapsible")).toBe("icon");
    // Labels and headings are hidden visually, not removed, so the items keep their names.
    expect(screen.getByRole("link", { name: "Inbox 3" })).toBeDefined();
    expect(screen.getByText("Folders")).toBeDefined();

    fireEvent.click(getByRole("button", { name: "Expand sidebar" }));
    expect(sidebar.getAttribute("data-state")).toBe("expanded");
  });

  it("gives the sidebar the module's accent colour", () => {
    stubScreen({ narrow: false });
    const { container } = renderSidebar({ accent: "#7c3aed" });

    const sidebar = container.querySelector<HTMLElement>("[data-slot=sidebar]");
    expect(sidebar?.style.getPropertyValue("--sidebar-primary")).toBe("#7c3aed");
  });
});

async function openDrawer() {
  stubScreen({ narrow: true });
  renderSidebar();
  expect(screen.queryByRole("dialog")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  return within(await screen.findByRole("dialog", { name: "Mail" }));
}

describe("Sidebar on small screens", () => {
  it("opens as a drawer that a link inside closes", async () => {
    const drawer = await openDrawer();

    fireEvent.click(drawer.getByRole("link", { name: "Sent" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes with Escape", async () => {
    const drawer = await openDrawer();

    fireEvent.keyDown(drawer.getByRole("link", { name: "Sent" }), { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("stays open for other content", async () => {
    const drawer = await openDrawer();

    fireEvent.click(drawer.getByText("Storage: 2 GB of 15 GB"));

    expect(screen.getByRole("dialog", { name: "Mail" })).toBeDefined();
  });
});
