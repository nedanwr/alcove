import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Millisecond-precision Unix timestamp, defaulting to the current time. */
export const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`);

export const timestamps = {
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
};
