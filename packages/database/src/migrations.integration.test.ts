// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { sql } from "drizzle-orm";
import { expect, it } from "vitest";

import { databaseEnv } from "./env";
import { user } from "./schema";
import { createTestDatabase } from "./testing";

it("applies every migration to an empty database", async () => {
  const { db, drop } = await createTestDatabase(databaseEnv(process.env).DATABASE_URL);

  try {
    const { rows } = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );

    expect(rows.map((row) => row.table_name)).toEqual([
      "account",
      "installation",
      "session",
      "user",
      "verification",
    ]);
  } finally {
    await drop();
  }
});

it("rejects usernames that differ only in case", async () => {
  const { db, drop } = await createTestDatabase(databaseEnv(process.env).DATABASE_URL);

  try {
    await db
      .insert(user)
      .values({ id: "1", name: "Ada", email: "ada@example.com", username: "ada" });

    await expect(
      db.insert(user).values({ id: "2", name: "Ada", email: "ada2@example.com", username: "ADA" }),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
  } finally {
    await drop();
  }
});
