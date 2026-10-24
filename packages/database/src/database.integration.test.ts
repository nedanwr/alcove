// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { sql } from "drizzle-orm";
import { afterAll, expect, it } from "vitest";

import { createDatabase } from "./database";
import { databaseEnv } from "./env";

const db = createDatabase(databaseEnv(process.env).DATABASE_URL);

afterAll(async () => {
  await db.$client.end();
});

it("queries PostgreSQL through the Drizzle client", async () => {
  const { rows } = await db.execute<{ ok: number }>(sql`select 1 as ok`);

  expect(rows).toEqual([{ ok: 1 }]);
});
