// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function databaseEnv(runtimeEnv: Record<string, string | undefined>) {
  return createEnv({
    server: {
      DATABASE_URL: z.url({
        protocol: /^postgres(?:ql)?$/,
        error: "Must be set to a postgres:// or postgresql:// connection URL",
      }),
    },
    // Not `emptyStringAsUndefined`: it deletes every empty variable from
    // `runtimeEnv`, which is `process.env` on the server.
    runtimeEnv,
  });
}
