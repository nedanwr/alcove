// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { randomBytes } from "node:crypto";

import { databaseEnv } from "@alcove/database/env";
import { createTestDatabase, type TestDatabase } from "@alcove/database/testing";

import { createAuth, type Auth } from "~/auth/create-auth.server";

export const origin = "http://localhost:3000";
export const administrator = {
  name: "Ada Lovelace",
  username: "ada",
  email: "ada@example.com",
  password: "correct horse battery",
};

export interface Harness {
  auth: Auth;
  database: TestDatabase;
}

export async function createHarness(): Promise<Harness> {
  const database = await createTestDatabase(databaseEnv(process.env).DATABASE_URL);
  const auth = createAuth({
    db: database.db,
    secret: randomBytes(32).toString("base64"),
    baseURL: origin,
  });
  return { auth, database };
}

export const day = 24 * 60 * 60 * 1000;

let clients = 0;

// Rate limiting is always on and counts requests per client IP, so each request comes from its own
// address unless a test sets one. Better Auth reads it from `X-Forwarded-For`.
function nextClientAddress() {
  clients++;
  return `198.18.${Math.floor(clients / 256)}.${clients % 256}`;
}

export function post(
  auth: Auth,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "X-Forwarded-For": nextClientAddress(),
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

export function get(auth: Auth, path: string, cookie: string) {
  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      headers: { Cookie: cookie, "X-Forwarded-For": nextClientAddress() },
    }),
  );
}

export function sessionCookie(response: Response) {
  const header = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("alcove.session_token="));
  if (!header) throw new Error("Response did not set a session cookie");
  return { cookie: header.split(";")[0] ?? "", attributes: header.toLowerCase() };
}

/** Session cookies hold `token.signature`. */
export function sessionToken(cookie: string) {
  return decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1)).split(".")[0] ?? "";
}

export async function errorCode(response: Response) {
  const body: unknown = await response.json();
  return typeof body === "object" && body !== null && "code" in body ? body.code : undefined;
}
