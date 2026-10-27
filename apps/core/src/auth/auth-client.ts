// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

// Calls Core's own `/api/auth` endpoints, so the base URL is the current origin.
export const authClient = createAuthClient({ plugins: [usernameClient()] });
