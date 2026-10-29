// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountIdentity } from "~/components/settings/account-identity";

afterEach(cleanup);

function avatar() {
  return document.querySelector('[data-slot="account-identity"] > [aria-hidden]');
}

describe("AccountIdentity", () => {
  it("shows the account's initials, name, role, and email", () => {
    render(
      <AccountIdentity
        user={{ name: "Ada Lovelace", email: "ada@example.com", administrator: true }}
      />,
    );

    expect(avatar()?.textContent).toBe("AL");
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("Administrator")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows other accounts as members", () => {
    render(
      <AccountIdentity
        user={{ name: "Grace Hopper", email: "grace@example.com", administrator: false }}
      />,
    );

    expect(screen.getByText("Member")).toBeTruthy();
    expect(screen.queryByText("Administrator")).toBeNull();
  });

  it("falls back to the email's initial without a name", () => {
    render(
      <AccountIdentity user={{ name: " ", email: "ada@example.com", administrator: false }} />,
    );

    expect(avatar()?.textContent).toBe("A");
  });
});
