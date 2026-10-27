// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { Database } from "@alcove/database";
import * as schema from "@alcove/database/schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins/username";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { initialSetup } from "~/auth/initial-setup.server";
import { isUsernameValid, passwordLength, usernameLength } from "~/auth/validation";

const day = 60 * 60 * 24;

export interface AuthOptions {
  db: Database;
  secret: string;
  /** The origin Core is served from. Better Auth also trusts it for CSRF and redirect checks. */
  baseURL: string;
}

/** Core's Better Auth instance. A factory, so integration tests can run it against their own database. */
export function createAuth({ db, secret, baseURL }: AuthOptions) {
  return betterAuth({
    appName: "Alcove",
    baseURL,
    secret,
    // Transactions are required: initial setup relies on them to roll back losing attempts.
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: passwordLength.min,
      maxPasswordLength: passwordLength.max,
    },
    session: {
      expiresIn: 7 * day,
      // Active sessions are extended at most once a day.
      updateAge: day,
    },
    advanced: {
      cookiePrefix: "alcove",
      database: { joins: true },
      // Better Auth skips CSRF and redirect origin checks when `NODE_ENV=test` or `TEST` is set.
      // Keep them on unconditionally, so a stray variable can't disable them.
      disableOriginCheck: false,
    },
    // Better Auth only rate-limits when `NODE_ENV=production`, which the server build doesn't set.
    // Memory storage is per process, so multiple Core replicas will need a shared store.
    rateLimit: { enabled: true, storage: "memory" },
    telemetry: { enabled: false },
    // The username plugin's endpoint for checking whether a username is taken would let anyone
    // discover which accounts exist.
    disabledPaths: ["/is-username-available"],
    plugins: [
      // Before `username`, whose sign-up hooks report taken usernames: once the installation is
      // initialized, every sign-up must fail with the same error.
      initialSetup(),
      username({
        minUsernameLength: usernameLength.min,
        maxUsernameLength: usernameLength.max,
        usernameValidator: isUsernameValid,
        // Alcove shows the user's name, so it has no use for a separately cased username.
        displayUsername: false,
      }),
      // Must stay last, so it forwards cookies set by the other plugins.
      tanstackStartCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
