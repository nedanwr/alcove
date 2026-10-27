// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { expect, it } from "vitest";

import { databaseEnv } from "./env";
import { installation, user } from "./schema";
import { createTestDatabase, migrationsFolder } from "./testing";

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

async function migrationsBefore(tag: string) {
  const folder = await mkdtemp(join(tmpdir(), "alcove-migrations-"));
  await cp(migrationsFolder, folder, { recursive: true });

  const journalPath = join(folder, "meta", "_journal.json");
  const journal: unknown = JSON.parse(await readFile(journalPath, "utf8"));
  if (typeof journal !== "object" || journal === null || !("entries" in journal)) {
    throw new Error("Unexpected migration journal");
  }
  const entries = Array.isArray(journal.entries) ? journal.entries : [];
  const index = entries.findIndex(
    (entry: unknown) =>
      typeof entry === "object" && entry !== null && "tag" in entry && entry.tag === tag,
  );
  if (index === -1) throw new Error(`No migration tagged ${tag}`);
  await writeFile(journalPath, JSON.stringify({ ...journal, entries: entries.slice(0, index) }));

  return folder;
}

it("makes users created before roles existed the administrator", async () => {
  const folder = await migrationsBefore("0004_administrator_role");

  try {
    const { db, drop } = await createTestDatabase(databaseEnv(process.env).DATABASE_URL, {
      migrationsFolder: folder,
    });

    try {
      await db
        .insert(user)
        .values({ id: "1", name: "Ada", email: "ada@example.com", username: "ada" });
      await db.insert(installation).values({ id: "alcove", initializedAt: new Date() });

      await migrate(db, { migrationsFolder });

      const [administrator] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, "1"));
      const [row] = await db.select({ name: installation.name }).from(installation);
      expect(administrator?.role).toBe("admin");
      expect(row?.name).toBe("Alcove");
    } finally {
      await drop();
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
