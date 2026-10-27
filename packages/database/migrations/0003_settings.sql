ALTER TABLE "installation" ADD COLUMN "name" text DEFAULT 'Alcove' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;