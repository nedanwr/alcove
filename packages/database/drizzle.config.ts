// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

import { databaseEnv } from "./src/env";

// drizzle-kit doesn't load `.env` files.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  dialect: "postgresql",
  // Created with Core's first tables.
  schema: "./src/schema/index.ts",
  out: "./migrations",
  casing: "snake_case",
  dbCredentials: {
    // A getter, so `generate` and `check` work without a `DATABASE_URL`.
    get url() {
      return databaseEnv(process.env).DATABASE_URL;
    },
  },
  strict: true,
  verbose: true,
});
