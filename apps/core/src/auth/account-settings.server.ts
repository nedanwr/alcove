// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { BetterAuthPlugin, GenericEndpointContext } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import type { z } from "zod";

import {
  accountUpdateSchema,
  emailChangeSchema,
  passwordChangeSchema,
  passwordContainsIdentity,
  passwordIdentityMessage,
} from "~/auth/validation";

type BeforeHook = NonNullable<NonNullable<BetterAuthPlugin["hooks"]>["before"]>[number];

type AccountSession = NonNullable<
  Awaited<ReturnType<typeof getSessionFromCtx<{ username?: string | null }>>>
>;

function parseBody<Schema extends z.ZodType>(schema: Schema, body: unknown): z.output<Schema> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_ACCOUNT_DETAILS",
      message: result.error.issues[0]?.message ?? "Invalid account details",
    });
  }
  return result.data;
}

// The same error Better Auth's password change returns for a wrong current password.
function invalidPassword() {
  return new APIError("BAD_REQUEST", {
    code: "INVALID_PASSWORD",
    message: "Your current password is incorrect",
  });
}

async function verifyCurrentPassword(
  ctx: GenericEndpointContext,
  userId: string,
  password: string,
) {
  const { internalAdapter, password: hasher } = ctx.context;
  if (password.length > hasher.config.maxPasswordLength) throw invalidPassword();

  const credential = await internalAdapter.findCredentialAccount(userId);
  if (!credential?.password) throw invalidPassword();
  if (!(await hasher.verify({ hash: credential.password, password }))) throw invalidPassword();
}

function signedInHook(
  path: string,
  handler: (ctx: GenericEndpointContext, session: AccountSession) => Promise<unknown>,
): BeforeHook {
  return {
    matcher: (ctx) => ctx.path === path,
    handler: createAuthMiddleware(async (ctx) => {
      const session = await getSessionFromCtx<{ username?: string | null }>(ctx);
      if (!session) return;
      return handler(ctx, session);
    }),
  };
}

// Enforced on Better Auth's endpoints, not just in the settings forms, so the rules hold for every
// caller. Signed-out requests pass through to the endpoint, which rejects them.
export function accountSettings() {
  return {
    id: "alcove-account-settings",
    hooks: {
      before: [
        signedInHook("/update-user", async (ctx, session) => {
          const { currentPassword, ...changes } = parseBody(accountUpdateSchema, ctx.body);
          if (changes.username !== undefined && changes.username !== session.user.username) {
            await verifyCurrentPassword(ctx, session.user.id, currentPassword ?? "");
          }
          return { context: { body: changes } };
        }),
        signedInHook("/change-email", async (ctx, session) => {
          const { newEmail, currentPassword, ...rest } = parseBody(emailChangeSchema, ctx.body);
          await verifyCurrentPassword(ctx, session.user.id, currentPassword);

          const email = newEmail.toLowerCase();
          // Better Auth would otherwise appear to succeed without changing a taken email.
          const owner = await ctx.context.internalAdapter.findUserByEmail(email);
          if (owner && owner.user.id !== session.user.id) {
            throw new APIError("BAD_REQUEST", {
              code: "EMAIL_UNAVAILABLE",
              message: "This email is already used by another account",
            });
          }
          return { context: { body: { ...rest, newEmail: email } } };
        }),
        signedInHook("/change-password", async (ctx, session) => {
          const { newPassword } = parseBody(passwordChangeSchema, ctx.body);
          const identity = { username: session.user.username ?? "", email: session.user.email };
          if (passwordContainsIdentity(newPassword, identity)) {
            throw new APIError("BAD_REQUEST", {
              code: "PASSWORD_CONTAINS_IDENTITY",
              message: passwordIdentityMessage,
            });
          }
          // A password change must end sessions an attacker may hold, whatever the caller asks.
          return { context: { body: { revokeOtherSessions: true } } };
        }),
      ],
    },
  } satisfies BetterAuthPlugin;
}
