// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { AccountSession } from "~/auth/auth-state";
import { requireSession } from "~/auth/auth-state.server";
import type { Auth } from "~/auth/create-auth.server";
import { PublicError } from "~/public-error";

async function activeSessions(auth: Auth, userId: string) {
  const { internalAdapter } = await auth.$context;
  const now = new Date();
  const sessions = await internalAdapter.listSessions(userId, { onlyActiveSessions: true });
  return sessions.filter((session) => session.expiresAt > now);
}

// `auth.api.listSessions` refuses sessions more than a day old, so read them through the internal
// adapter instead.
export async function listAccountSessions(auth: Auth, headers: Headers): Promise<AccountSession[]> {
  const { session } = await requireSession(auth, headers);
  const sessions = await activeSessions(auth, session.userId);

  return sessions
    .map(({ id, createdAt, updatedAt, expiresAt, ipAddress, userAgent }) => ({
      id,
      createdAt,
      updatedAt,
      expiresAt,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      current: id === session.id,
    }))
    .toSorted(
      (a, b) =>
        Number(b.current) - Number(a.current) || b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
}

export async function revokeAccountSession(auth: Auth, headers: Headers, sessionId: string) {
  const { session } = await requireSession(auth, headers);
  if (sessionId === session.id) throw new PublicError("Sign out to end this session.", 400);

  const target = (await activeSessions(auth, session.userId)).find(({ id }) => id === sessionId);
  // Already ended, or not the user's: either way, none of their sessions has that ID.
  if (!target) return;
  await auth.api.revokeSession({ headers, body: { token: target.token } });
}

export async function revokeOtherAccountSessions(auth: Auth, headers: Headers) {
  await requireSession(auth, headers);
  await auth.api.revokeOtherSessions({ headers });
}
