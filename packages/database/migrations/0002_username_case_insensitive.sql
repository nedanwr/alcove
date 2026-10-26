-- Better Auth's schema can't express an expression index, so usernames that differ only in case
-- are rejected here.
CREATE UNIQUE INDEX "user_username_lower_unique" ON "user" (lower("username"));
