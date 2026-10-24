// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { databaseEnv } from "@alcove/database/env";
import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  // Server variables come from `process.env`; `import.meta.env` only holds
  // `VITE_` variables. Browsers have no real `process.env`, so the client passes `{}`.
  extends: [databaseEnv(import.meta.env.SSR ? process.env : {})],
  server: {},
  clientPrefix: "VITE_",
  client: {},
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
