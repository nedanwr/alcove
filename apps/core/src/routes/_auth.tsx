// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AuthLayout } from "~/components/auth/auth-layout";
import { getInstallationHost } from "~/installation.functions";

export const Route = createFileRoute("/_auth")({
  loader: () => getInstallationHost(),
  // The host comes from configuration, so it can't change while Core runs.
  staleTime: Number.POSITIVE_INFINITY,
  component: Auth,
});

function Auth() {
  const host = Route.useLoaderData();

  return (
    <AuthLayout host={host}>
      <Outlet />
    </AuthLayout>
  );
}
