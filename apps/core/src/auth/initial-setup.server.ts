// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  getCurrentAdapter,
  type BetterAuthOptions,
  type BetterAuthPlugin,
  type DBAdapter,
} from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { administratorSchema } from "~/auth/validation";

/** The installation table holds at most one row, always under this key. */
export const INSTALLATION_ID = "alcove";

export const ADMINISTRATOR_ROLE = "admin";

export const DEFAULT_INSTALLATION_NAME = "Alcove";

const UNIQUE_VIOLATION = "23505";

// Initialization is permanent, so once an adapter reports it, it never needs checking again.
const initializedAdapters = new WeakSet<object>();

/** Whether the first administrator has been created. */
export async function isInitialized<Options extends BetterAuthOptions>(
  adapter: DBAdapter<Options>,
): Promise<boolean> {
  if (initializedAdapters.has(adapter)) return true;

  const row = await adapter.findOne({
    model: "installation",
    where: [{ field: "id", value: INSTALLATION_ID }],
  });

  if (row) initializedAdapters.add(adapter);
  return row !== null;
}

function registrationClosed() {
  return new APIError("FORBIDDEN", {
    code: "REGISTRATION_CLOSED",
    message: "Registration is closed. Ask an administrator for an account.",
  });
}

// Drizzle wraps driver errors, so look through the cause chain for PostgreSQL's error code.
function isUniqueViolation(error: unknown): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ("code" in current && current.code === UNIQUE_VIOLATION) return true;
  }
  return false;
}

/**
 * Turns Better Auth's email sign-up into Alcove's one-time administrator setup.
 *
 * Sign-up stays enabled so setup reuses Better Auth's validation, password hashing, and session
 * cookies, but this plugin closes it for good once the installation is initialized:
 *
 * - A before hook rejects sign-up requests after initialization, before any account lookup, so
 *   the response never reveals which emails are registered. It also validates the submitted data.
 * - A database hook claims the installation row inside the transaction that creates the user, and
 *   makes that user the administrator. The row has a fixed primary key, so concurrent setups
 *   serialize on it: one commits and the rest fail with a unique violation and roll back their
 *   user. It runs for every user creation, so no other path can add users either until user
 *   management explicitly allows it.
 *
 * The installation model is declared here, rather than only in Drizzle, because the claim must
 * go through Better Auth's transaction-bound adapter to share the user's transaction.
 */
export function initialSetup() {
  return {
    id: "alcove-initial-setup",
    schema: {
      user: {
        fields: {
          // Named and valued like Better Auth's admin plugin, so it can adopt the field later.
          role: { type: "string", required: true, defaultValue: "user", input: false },
        },
      },
      installation: {
        fields: {
          initializedAt: { type: "date", required: true, input: false },
          name: {
            type: "string",
            required: true,
            defaultValue: DEFAULT_INSTALLATION_NAME,
            input: false,
          },
        },
      },
    },
    hooks: {
      before: [
        {
          matcher: (ctx) => ctx.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            if (await isInitialized(ctx.context.adapter)) throw registrationClosed();

            const result = administratorSchema.safeParse(ctx.body);
            if (!result.success) {
              throw new APIError("BAD_REQUEST", {
                code: "INVALID_ADMINISTRATOR",
                message: result.error.issues[0]?.message ?? "Invalid administrator details",
              });
            }

            return { context: { body: result.data } };
          }),
        },
      ],
    },
    init: (authContext) => ({
      options: {
        databaseHooks: {
          user: {
            create: {
              before: async (user) => {
                const adapter = await getCurrentAdapter(authContext.adapter);

                try {
                  await adapter.create({
                    model: "installation",
                    data: { id: INSTALLATION_ID, initializedAt: new Date() },
                    forceAllowId: true,
                  });
                } catch (error) {
                  if (isUniqueViolation(error)) throw registrationClosed();
                  throw error;
                }

                return { data: { ...user, role: ADMINISTRATOR_ROLE } };
              },
            },
          },
        },
      },
    }),
  } satisfies BetterAuthPlugin;
}
