// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { databaseEnv } from "@alcove/database/env";
import { createEnv } from "@t3-oss/env-core";

import { authEnv } from "~/auth/env";

// Server variables come from `process.env`; `import.meta.env` only holds
// `VITE_` variables. Browsers have no real `process.env`, so the client passes `{}`.
const serverEnv = import.meta.env.SSR ? process.env : {};

export const env = createEnv({
  extends: [databaseEnv(serverEnv), authEnv(serverEnv)],
  server: {},
  clientPrefix: "VITE_",
  client: {},
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
