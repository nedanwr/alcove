// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });

  // pg emits errors from idle clients (for example, when PostgreSQL restarts) on
  // the pool. Without a listener they crash the process; with one, the pool
  // discards the broken client and later queries reconnect.
  pool.on("error", (error) => {
    console.error("Idle PostgreSQL client error", error);
  });

  return drizzle({ client: pool, casing: "snake_case" });
}

export type Database = ReturnType<typeof createDatabase>;
