import { relations } from "drizzle-orm";

import { domains } from "./domains";
import { mailboxMessages } from "./mailbox-messages";
import { mailboxes } from "./mailboxes";
import { messages } from "./messages";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
  mailboxes: many(mailboxes),
}));

export const domainsRelations = relations(domains, ({ many }) => ({
  mailboxes: many(mailboxes),
}));

export const mailboxesRelations = relations(mailboxes, ({ one, many }) => ({
  user: one(users, { fields: [mailboxes.userId], references: [users.id] }),
  domain: one(domains, {
    fields: [mailboxes.domainId],
    references: [domains.id],
  }),
  messages: many(mailboxMessages),
}));

export const messagesRelations = relations(messages, ({ many }) => ({
  mailboxes: many(mailboxMessages),
}));

export const mailboxMessagesRelations = relations(mailboxMessages, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [mailboxMessages.mailboxId],
    references: [mailboxes.id],
  }),
  message: one(messages, {
    fields: [mailboxMessages.messageId],
    references: [messages.id],
  }),
}));
