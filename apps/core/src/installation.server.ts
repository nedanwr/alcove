// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { Database } from "@alcove/database";
import { installation } from "@alcove/database/schema";
import { eq } from "drizzle-orm";
import type { z } from "zod";

import { requireAdministrator, requireSession } from "~/auth/auth-state.server";
import type { Auth } from "~/auth/create-auth.server";
import { INSTALLATION_ID } from "~/auth/initial-setup.server";
import type { installationSettingsSchema } from "~/installation";

async function readInstallation(db: Database) {
  const [row] = await db
    .select({ name: installation.name, initializedAt: installation.initializedAt })
    .from(installation)
    .where(eq(installation.id, INSTALLATION_ID));
  // Signed-in users only exist once setup has created the row.
  if (!row) throw new Error("The installation isn't initialized");
  return row;
}

export async function getInstallationName(auth: Auth, db: Database, headers: Headers) {
  await requireSession(auth, headers);
  return (await readInstallation(db)).name;
}

export async function getInstallationRecord(auth: Auth, db: Database, headers: Headers) {
  await requireAdministrator(auth, headers);
  return readInstallation(db);
}

export async function updateInstallation(
  auth: Auth,
  db: Database,
  headers: Headers,
  settings: z.output<typeof installationSettingsSchema>,
) {
  await requireAdministrator(auth, headers);
  await db.update(installation).set(settings).where(eq(installation.id, INSTALLATION_ID));
}
