// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "~/auth/auth.server";
import { db } from "~/database.server";
import { env } from "~/env";
import { installationSettingsSchema, type InstallationSettings } from "~/installation";
import {
  getInstallationName as readInstallationName,
  getInstallationRecord,
  updateInstallation,
} from "~/installation.server";
import { runServerFunction } from "~/server-function.server";

/** The host people open Alcove at, from the configured `BETTER_AUTH_URL`, such as `cloud.example.net`. */
export const getInstallationHost = createServerFn({ method: "GET" }).handler(
  () => new URL(env.BETTER_AUTH_URL).host,
);

export const getInstallationName = createServerFn({ method: "GET" }).handler(() =>
  runServerFunction("load the installation name", () =>
    readInstallationName(auth, db, getRequestHeaders()),
  ),
);

export const getInstallationSettings = createServerFn({ method: "GET" }).handler(() =>
  runServerFunction("load instance settings", async (): Promise<InstallationSettings> => {
    const record = await getInstallationRecord(auth, db, getRequestHeaders());
    return { ...record, url: new URL(env.BETTER_AUTH_URL).origin, version: ALCOVE_CORE_VERSION };
  }),
);

export const updateInstallationSettings = createServerFn({ method: "POST" })
  .validator(installationSettingsSchema)
  .handler(({ data }) =>
    runServerFunction("save instance settings", () =>
      updateInstallation(auth, db, getRequestHeaders(), data),
    ),
  );
