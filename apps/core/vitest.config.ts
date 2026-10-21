// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { defineConfig } from "vitest/config";

// Kept apart from `vite.config.ts` so tests don't load the TanStack Start, Nitro, and Tailwind plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
});
