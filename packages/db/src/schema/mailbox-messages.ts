import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamp } from "./columns";
import { mailboxes } from "./mailboxes";
import { messages } from "./messages";

/** Membership of a message in a mailbox, with per-mailbox read state. */
export const mailboxMessages = sqliteTable(
  "mailbox_messages",
  {
    mailboxId: text("mailbox_id")
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    receivedAt: timestamp("received_at"),
    // Null while unread.
    readAt: integer("read_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    primaryKey({ columns: [t.mailboxId, t.messageId] }),
    index("mailbox_messages_mailbox_id_received_at_idx").on(t.mailboxId, t.receivedAt),
    index("mailbox_messages_message_id_idx").on(t.messageId),
    index("mailbox_messages_unread_idx")
      .on(t.mailboxId)
      .where(sql`${t.readAt} is null`),
  ],
);

export type MailboxMessage = typeof mailboxMessages.$inferSelect;
export type NewMailboxMessage = typeof mailboxMessages.$inferInsert;
