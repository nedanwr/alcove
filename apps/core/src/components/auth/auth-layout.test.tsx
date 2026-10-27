// @vitest-environment happy-dom
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { version } from "../../../package.json";
import { AuthLayout } from "~/components/auth/auth-layout";

afterEach(cleanup);

describe("AuthLayout", () => {
  it("shows Core's version from its package.json", () => {
    render(<AuthLayout host="alcove.example">Content</AuthLayout>);

    expect(screen.getByText(`Alcove Core ${version}`)).toBeTruthy();
  });
});
