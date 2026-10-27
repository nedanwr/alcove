// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { AuthState } from "~/auth/auth-state";
import type { Auth } from "~/auth/create-auth.server";
import { isInitialized } from "~/auth/initial-setup.server";

export async function loadAuthState(auth: Auth, headers: Headers): Promise<AuthState> {
  // No session can exist before setup, so skip the lookup.
  const { adapter } = await auth.$context;
  if (!(await isInitialized(adapter))) return { initialized: false, user: null };

  const session = await auth.api.getSession({ headers });
  if (!session) return { initialized: true, user: null };

  const { id, name, email, image } = session.user;
  return { initialized: true, user: { id, name, email, image: image ?? null } };
}
