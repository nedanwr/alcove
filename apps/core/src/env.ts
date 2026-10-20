// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  server: {},
  clientPrefix: "VITE_",
  client: {},
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
