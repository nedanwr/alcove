import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { id, timestamps } from "./columns";

export const users = sqliteTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    // Stored lowercase so the unique constraint is case-insensitive.
    email: text("email").notNull().unique(),
    ...timestamps,
  },
  (t) => [check("users_email_lowercase", sql`${t.email} = lower(${t.email})`)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
