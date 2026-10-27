-- Until now, setup was the only way to create a user, so every existing user is the administrator.
UPDATE "user" SET "role" = 'admin';
