// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { AuthState } from "~/auth/auth-state";
import type { Auth } from "~/auth/create-auth.server";
import { ADMINISTRATOR_ROLE, isInitialized } from "~/auth/initial-setup.server";
import { PublicError } from "~/public-error";

export async function loadAuthState(auth: Auth, headers: Headers): Promise<AuthState> {
  // No session can exist before setup, so skip the lookup.
  const { adapter } = await auth.$context;
  if (!(await isInitialized(adapter))) return { initialized: false, user: null };

  const session = await auth.api.getSession({ headers });
  if (!session) return { initialized: true, user: null };

  const { id, name, username, email, image, role } = session.user;
  return {
    initialized: true,
    user: {
      id,
      name,
      username: username ?? null,
      email,
      image: image ?? null,
      administrator: role === ADMINISTRATOR_ROLE,
    },
  };
}

// Route guards only steer navigation. Server functions that read or change protected data must
// check the session with these.
export async function requireSession(auth: Auth, headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) throw new PublicError("Your session has ended. Sign in again.", 401);
  return session;
}

export async function requireAdministrator(auth: Auth, headers: Headers) {
  const session = await requireSession(auth, headers);
  if (session.user.role !== ADMINISTRATOR_ROLE) {
    throw new PublicError("Only the administrator can manage instance settings.", 403);
  }
  return session;
}
