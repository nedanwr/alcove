// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/account", replace: true });
  },
});
