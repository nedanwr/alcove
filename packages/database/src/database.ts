// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index";

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });

  // Handle idle client errors to prevent PostgreSQL disconnects from
  // crashing the process.
  pool.on("error", (error) => {
    console.error("Idle PostgreSQL client error", error);
  });

  return drizzle({ client: pool, schema, casing: "snake_case" });
}

export type Database = ReturnType<typeof createDatabase>;
