// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync } from "node:fs";

import { configDefaults, defineConfig } from "vitest/config";

// Vitest doesn't load `.env` into `process.env`, where integration tests read `DATABASE_URL`.
if (existsSync(".env")) process.loadEnvFile(".env");

const integrationTests = "src/**/*.integration.test.ts";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, integrationTests],
        },
      },
      {
        test: {
          name: "integration",
          include: [integrationTests],
        },
      },
    ],
  },
});
