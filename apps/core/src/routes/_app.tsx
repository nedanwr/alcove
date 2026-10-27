// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireUser } from "~/auth/auth-state";
import { AppShell } from "~/components/shell/app-shell";

// Pathless layout: every route under `_app/` renders inside the application shell.
export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => ({ user: requireUser(context.auth, location) }),
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
