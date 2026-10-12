import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { readFile } from "node:fs/promises";
import { defineConfig, type Plugin } from "vitest/config";

// Imports `.eml` fixtures as their exact bytes. Vite's `?raw` reads files as UTF-8,
// which would corrupt fixtures in legacy 8-bit charsets.
const emlFixtures: Plugin = {
  name: "eml-fixtures",
  enforce: "pre",
  async load(id) {
    if (!id.endsWith(".eml")) return null;
    const base64 = (await readFile(id)).toString("base64");
    return `export default Uint8Array.from(atob(${JSON.stringify(base64)}), (c) => c.charCodeAt(0));`;
  },
};

export default defineConfig({
  plugins: [
    emlFixtures,
    // Runs the tests inside workerd, the Cloudflare Workers runtime.
    cloudflareTest({ miniflare: { compatibilityDate: "2025-09-02" } }),
  ],
  test: {
    // The Workers runner cannot read Vitest's file system module cache.
    fsModuleCache: false,
  },
});
