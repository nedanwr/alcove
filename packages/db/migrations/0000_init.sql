CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	CONSTRAINT "users_email_lowercase" CHECK("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	CONSTRAINT "domains_name_lowercase" CHECK("domains"."name" = lower("domains"."name"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_name_unique` ON `domains` (`name`);--> statement-breakpoint
CREATE TABLE `mailboxes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain_id` text NOT NULL,
	`local_part` text NOT NULL,
	`display_name` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "mailboxes_local_part_lowercase" CHECK("mailboxes"."local_part" = lower("mailboxes"."local_part")),
	CONSTRAINT "mailboxes_local_part_not_empty" CHECK(length("mailboxes"."local_part") > 0)
);
--> statement-breakpoint
CREATE INDEX `mailboxes_user_id_idx` ON `mailboxes` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mailboxes_domain_id_local_part_unique` ON `mailboxes` (`domain_id`,`local_part`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id_header` text,
	`from_address` text NOT NULL,
	`from_name` text,
	`to_addresses` text DEFAULT '[]' NOT NULL,
	`cc_addresses` text DEFAULT '[]' NOT NULL,
	`subject` text,
	`text_body` text,
	`html_body` text,
	`sent_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_message_id_header_idx` ON `messages` (`message_id_header`);--> statement-breakpoint
CREATE TABLE `mailbox_messages` (
	`mailbox_id` text NOT NULL,
	`message_id` text NOT NULL,
	`received_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`read_at` integer,
	PRIMARY KEY(`mailbox_id`, `message_id`),
	FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mailbox_messages_mailbox_id_received_at_idx` ON `mailbox_messages` (`mailbox_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `mailbox_messages_message_id_idx` ON `mailbox_messages` (`message_id`);--> statement-breakpoint
CREATE INDEX `mailbox_messages_unread_idx` ON `mailbox_messages` (`mailbox_id`) WHERE "mailbox_messages"."read_at" is null;