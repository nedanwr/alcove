import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { id, timestamps } from "./columns";
import { domains } from "./domains";
import { users } from "./users";

/** An email address (`localPart@domain`) owned by a user. */
export const mailboxes = sqliteTable(
  "mailboxes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "restrict" }),
    // The part before the "@". Stored lowercase.
    localPart: text("local_part").notNull(),
    // Optional sender name shown on outgoing mail.
    displayName: text("display_name"),
    ...timestamps,
  },
  (t) => [
    unique("mailboxes_domain_id_local_part_unique").on(t.domainId, t.localPart),
    index("mailboxes_user_id_idx").on(t.userId),
    check("mailboxes_local_part_lowercase", sql`${t.localPart} = lower(${t.localPart})`),
    check("mailboxes_local_part_not_empty", sql`length(${t.localPart}) > 0`),
  ],
);

export type Mailbox = typeof mailboxes.$inferSelect;
export type NewMailbox = typeof mailboxes.$inferInsert;
