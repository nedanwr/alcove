// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync } from "node:fs";

import { configDefaults, defineConfig } from "vitest/config";

import packageJson from "./package.json" with { type: "json" };

// Vitest doesn't load `.env` into `process.env`, where integration tests read `DATABASE_URL`.
if (existsSync(".env")) process.loadEnvFile(".env");

const integrationTests = "src/**/*.integration.test.{ts,tsx}";

// Kept apart from `vite.config.ts` so tests don't load the TanStack Start, Nitro, and Tailwind plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  define: { ALCOVE_CORE_VERSION: JSON.stringify(packageJson.version) },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: [...configDefaults.exclude, integrationTests],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: [integrationTests],
          // Each file creates and migrates its own database.
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
