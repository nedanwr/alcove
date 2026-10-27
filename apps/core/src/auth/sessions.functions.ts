// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { auth } from "~/auth/auth.server";
import {
  listAccountSessions,
  revokeAccountSession,
  revokeOtherAccountSessions,
} from "~/auth/sessions.server";
import { runServerFunction } from "~/server-function.server";

export const getAccountSessions = createServerFn({ method: "GET" }).handler(() =>
  runServerFunction("list sessions", () => listAccountSessions(auth, getRequestHeaders())),
);

export const revokeSession = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(({ data }) =>
    runServerFunction("revoke a session", () =>
      revokeAccountSession(auth, getRequestHeaders(), data.id),
    ),
  );

export const revokeOtherSessions = createServerFn({ method: "POST" }).handler(() =>
  runServerFunction("revoke other sessions", () =>
    revokeOtherAccountSessions(auth, getRequestHeaders()),
  ),
);
