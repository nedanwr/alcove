// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    nitro(),
    tailwindcss(),
    tanstackStart({
      // `@alcove/database/env` is allowed because the shared `~/env` imports it;
      // its server variables throw when read on the client.
      importProtection: {
        client: { specifiers: [/^@alcove\/database(?!\/env$)/] },
      },
    }),
    viteReact(),
  ],
});
