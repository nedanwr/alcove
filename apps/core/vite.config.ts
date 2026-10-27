// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import packageJson from "./package.json" with { type: "json" };

export default defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  // Inline only the version, so the client never receives the rest of `package.json`.
  define: { ALCOVE_CORE_VERSION: JSON.stringify(packageJson.version) },
  // Bundle every dependency into the production SSR build, as Nitro does for the server output.
  // Otherwise Vite keeps `react` external while bundling packages that only `@alcove/ui` depends
  // on, such as Base UI. Their CommonJS dependencies then load a second copy of React at runtime
  // through `require("react")`, which Nitro can't bundle, and server rendering fails.
  ...(command === "build" && { environments: { ssr: { resolve: { noExternal: true } } } }),
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
}));
