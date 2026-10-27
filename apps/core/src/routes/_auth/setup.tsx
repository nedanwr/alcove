// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";

import { requireUninitialized } from "~/auth/auth-state";
import { SetupForm } from "~/components/auth/setup-form";

// First-run setup. The route guard only steers visitors; the server enforces that setup runs once.
export const Route = createFileRoute("/_auth/setup")({
  beforeLoad: ({ context }) => requireUninitialized(context.auth),
  head: () => ({ meta: [{ title: "Set up · Alcove" }] }),
  component: Setup,
});

function Setup() {
  const router = useRouter();

  return <SetupForm onCreated={() => router.invalidate()} />;
}
