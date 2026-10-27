// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createDatabase } from "@alcove/database";

import { createAuth } from "~/auth/create-auth.server";

// Entry point for `pnpm auth:generate`. The Better Auth CLI only reads this configuration to
// derive Core's schema: it never connects to the database or uses the secret.
export const auth = createAuth({
  db: createDatabase("postgresql://localhost/alcove"),
  secret: "",
  baseURL: "http://localhost:3000",
});
