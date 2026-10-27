// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function authEnv(runtimeEnv: Record<string, string | undefined>) {
  return createEnv({
    server: {
      BETTER_AUTH_SECRET: z
        .string()
        .min(32, "Must be at least 32 characters. Generate one with `openssl rand -base64 32`"),
      // An origin rather than a full URL: Core serves the auth API from its own root.
      BETTER_AUTH_URL: z
        .url({
          protocol: /^https?$/,
          error: "Must be the http:// or https:// origin Alcove is served from",
        })
        .refine(
          (value) => !URL.canParse(value) || new URL(value).origin === value.replace(/\/$/, ""),
          {
            error: "Must be an origin without a path, query, or fragment",
          },
        ),
    },
    runtimeEnv,
  });
}
