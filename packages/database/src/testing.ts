// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

import { createDatabase, type Database } from "./database";

export const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

export interface TestDatabase {
  db: Database;
  url: string;
  /** Closes the client and drops the database. */
  drop: () => Promise<void>;
}

async function execute(connectionString: string, statement: string) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
}

/**
 * Creates a migrated test database; requires CREATE DATABASE privileges. Pass `migrationsFolder` to
 * apply a different set of migrations, such as those before one under test.
 */
export async function createTestDatabase(
  url: string,
  options: { migrationsFolder?: string } = {},
): Promise<TestDatabase> {
  const name = `alcove_test_${randomUUID().replaceAll("-", "")}`;
  await execute(url, `create database "${name}"`);

  const testUrl = new URL(url);
  testUrl.pathname = `/${name}`;
  const db = createDatabase(testUrl.href);

  try {
    await migrate(db, { migrationsFolder: options.migrationsFolder ?? migrationsFolder });
  } catch (error) {
    await db.$client.end();
    await execute(url, `drop database "${name}"`);
    throw error;
  }

  return {
    db,
    url: testUrl.href,
    drop: async () => {
      await db.$client.end();
      await execute(url, `drop database if exists "${name}" with (force)`);
    },
  };
}
