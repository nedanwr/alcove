import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { id, timestamps } from "./columns";

export const domains = sqliteTable(
  "domains",
  {
    id: id(),
    // Fully qualified domain name, e.g. "example.com". Stored lowercase.
    name: text("name").notNull().unique(),
    ...timestamps,
  },
  (t) => [check("domains_name_lowercase", sql`${t.name} = lower(${t.name})`)],
);

export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
