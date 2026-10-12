import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { id, timestamps } from "./columns";

export type EmailAddress = { name?: string; address: string };

/**
 * A single email message. A message delivered to several local mailboxes is
 * stored once and linked to each through `mailbox_messages`.
 */
export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    // RFC 5322 Message-ID header, if present. Not unique across senders.
    messageIdHeader: text("message_id_header"),
    fromAddress: text("from_address").notNull(),
    fromName: text("from_name"),
    toAddresses: text("to_addresses", { mode: "json" })
      .$type<EmailAddress[]>()
      .notNull()
      .default([]),
    ccAddresses: text("cc_addresses", { mode: "json" })
      .$type<EmailAddress[]>()
      .notNull()
      .default([]),
    subject: text("subject"),
    textBody: text("text_body"),
    htmlBody: text("html_body"),
    // Value of the Date header, if present and parseable.
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [index("messages_message_id_header_idx").on(t.messageIdHeader)],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
