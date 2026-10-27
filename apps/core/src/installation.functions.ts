// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createServerFn } from "@tanstack/react-start";

import { env } from "~/env";

/** The host people open Alcove at, from the configured `BETTER_AUTH_URL`, such as `cloud.example.net`. */
export const getInstallationHost = createServerFn({ method: "GET" }).handler(
  () => new URL(env.BETTER_AUTH_URL).host,
);
