// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { account, installation, session, user } from "@alcove/database/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadAuthState } from "~/auth/auth-state.server";
import {
  administrator,
  createHarness,
  day,
  errorCode,
  get,
  post,
  sessionCookie,
  sessionToken,
  type Harness,
} from "~/auth/testing";

// Exercises Better Auth through its HTTP handler, as the browser does, against a real database.

describe("initial setup", () => {
  let harness: Harness;

  beforeAll(async () => {
    harness = await createHarness();
  });

  afterAll(async () => {
    await harness.database.drop();
  });

  it("starts uninitialized", async () => {
    expect(await loadAuthState(harness.auth, new Headers())).toEqual({
      initialized: false,
      user: null,
    });
  });

  it.each([
    ["a blank name", { ...administrator, name: " " }],
    ["an invalid email", { ...administrator, email: "ada" }],
    ["a short password", { ...administrator, password: "short" }],
    ["a missing username", { ...administrator, username: undefined }],
    ["an invalid username", { ...administrator, username: "ada lovelace" }],
    ["a reserved username", { ...administrator, username: "Admin" }],
    ["a username with consecutive separators", { ...administrator, username: "ada._l" }],
    ["a numeric username", { ...administrator, username: "1843" }],
    ["a username that looks like an email", { ...administrator, username: "ada@example.com" }],
    [
      "a password containing the email's local part",
      { ...administrator, email: "lovelace@example.com", password: "Lovelace correct horse" },
    ],
    ["an unexpected field", { ...administrator, image: "https://evil.example/tracker.png" }],
  ])("rejects %s without initializing", async (_, body) => {
    const response = await post(harness.auth, "/sign-up/email", body);

    expect(response.status).toBe(400);
    expect(await harness.database.db.$count(user)).toBe(0);
    expect(await harness.database.db.$count(installation)).toBe(0);
  });

  it("creates exactly one administrator from concurrent attempts", async () => {
    const attempts = Array.from({ length: 8 }, (_, index) =>
      post(harness.auth, "/sign-up/email", {
        ...administrator,
        username: `admin-${index}`,
        email: `admin-${index}@example.com`,
      }),
    );
    const responses = await Promise.all(attempts);

    const created = responses.filter((response) => response.status === 200);
    const rejected = responses.filter((response) => response.status !== 200);
    expect(created).toHaveLength(1);
    expect(rejected.map((response) => response.status)).toEqual(Array(7).fill(403));
    for (const response of rejected) expect(await errorCode(response)).toBe("REGISTRATION_CLOSED");

    expect(await harness.database.db.$count(user)).toBe(1);
    expect(await harness.database.db.$count(account)).toBe(1);
    expect(await harness.database.db.$count(installation)).toBe(1);
  });

  it("lets the winning administrator sign in", async () => {
    const [winner] = await harness.database.db.select({ email: user.email }).from(user);
    const response = await post(harness.auth, "/sign-in/email", {
      email: winner?.email,
      password: administrator.password,
    });

    expect(response.status).toBe(200);
  });
});

describe("after setup", () => {
  let harness: Harness;
  let setupCookie: string;

  beforeAll(async () => {
    harness = await createHarness();
    // Mixed case, to check usernames are normalized.
    const response = await post(harness.auth, "/sign-up/email", {
      ...administrator,
      username: "Ada",
    });
    if (!response.ok) throw new Error(`Setup failed with status ${response.status}`);
    setupCookie = sessionCookie(response).cookie;
  });

  afterAll(async () => {
    await harness.database.drop();
  });

  it("signs the administrator in when setup completes", async () => {
    const state = await loadAuthState(harness.auth, new Headers({ Cookie: setupCookie }));

    expect(state).toEqual({
      initialized: true,
      user: {
        id: expect.any(String),
        name: "Ada Lovelace",
        username: "ada",
        email: "ada@example.com",
        image: null,
        administrator: true,
      },
    });
  });

  it("stores the username in lowercase", async () => {
    const [administratorRow] = await harness.database.db
      .select({ username: user.username })
      .from(user);

    expect(administratorRow?.username).toBe("ada");
  });

  it("stores the password as a hash", async () => {
    const [credential] = await harness.database.db
      .select({ password: account.password })
      .from(account);

    expect(credential?.password).toBeTruthy();
    expect(credential?.password).not.toContain(administrator.password);
  });

  it("closes public registration", async () => {
    const response = await post(harness.auth, "/sign-up/email", {
      ...administrator,
      email: "mallory@example.com",
    });

    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe("REGISTRATION_CLOSED");
    expect(await harness.database.db.$count(user)).toBe(1);
  });

  it("does not reveal whether an email is registered", async () => {
    const registered = await post(harness.auth, "/sign-up/email", administrator);
    const unregistered = await post(harness.auth, "/sign-up/email", {
      ...administrator,
      email: "nobody@example.com",
    });

    expect(registered.status).toBe(unregistered.status);
    expect(await registered.json()).toEqual(await unregistered.json());
  });

  it("does not reveal whether a username is taken", async () => {
    const taken = await post(harness.auth, "/sign-up/email", {
      ...administrator,
      email: "mallory@example.com",
    });
    const available = await post(harness.auth, "/sign-up/email", {
      ...administrator,
      username: "mallory",
      email: "mallory@example.com",
    });

    expect(taken.status).toBe(403);
    expect(taken.status).toBe(available.status);
    expect(await taken.json()).toEqual(await available.json());
  });

  it("doesn't offer an endpoint for checking usernames", async () => {
    const response = await post(harness.auth, "/is-username-available", { username: "ada" });

    expect(response.status).toBe(404);
  });

  it("refuses to create users through any other path", async () => {
    const { internalAdapter } = await harness.auth.$context;

    await expect(
      // As a future admin or OAuth path would, bypassing sign-up.
      internalAdapter.createUser(
        { name: "Mallory", email: "mallory@example.com" },
        { method: "admin" },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(await harness.database.db.$count(user)).toBe(1);
  });

  it("signs in with valid credentials and sets a secure session cookie", async () => {
    const response = await post(harness.auth, "/sign-in/email", {
      email: administrator.email,
      password: administrator.password,
    });

    expect(response.status).toBe(200);
    const { cookie, attributes } = sessionCookie(response);
    expect(attributes).toContain("httponly");
    expect(attributes).toContain("samesite=lax");
    // Persistent, so the session survives browser restarts and page refreshes.
    expect(attributes).toContain("max-age=");

    const sessionResponse = await get(harness.auth, "/get-session", cookie);
    expect(await sessionResponse.json()).toMatchObject({ user: { email: administrator.email } });
  });

  it("issues a new session token on every sign-in", async () => {
    const credentials = { email: administrator.email, password: administrator.password };
    const first = sessionCookie(await post(harness.auth, "/sign-in/email", credentials));
    const second = sessionCookie(
      await post(harness.auth, "/sign-in/email", credentials, { Cookie: first.cookie }),
    );

    expect(second.cookie).not.toBe(first.cookie);
  });

  it.each([
    ["a wrong password", { email: administrator.email, password: "incorrect horse battery" }],
    ["an unknown email", { email: "nobody@example.com", password: administrator.password }],
  ])("rejects %s with the same generic error", async (_, credentials) => {
    const response = await post(harness.auth, "/sign-in/email", credentials);

    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.json()).toMatchObject({ code: "INVALID_EMAIL_OR_PASSWORD" });
  });

  it.each(["ada", "ADA"])("signs in with the username %s", async (name) => {
    const response = await post(harness.auth, "/sign-in/username", {
      username: name,
      password: administrator.password,
    });

    expect(response.status).toBe(200);
    expect(sessionCookie(response).attributes).toContain("httponly");
  });

  it.each([
    ["a wrong password", { username: administrator.username, password: "incorrect horse battery" }],
    ["an unknown username", { username: "nobody", password: administrator.password }],
  ])("rejects a username sign-in with %s with the same generic error", async (_, credentials) => {
    const response = await post(harness.auth, "/sign-in/username", credentials);

    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.json()).toMatchObject({ code: "INVALID_USERNAME_OR_PASSWORD" });
  });

  it("rate-limits username sign-in like email sign-in", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 4; index++) {
      const response = await post(
        harness.auth,
        "/sign-in/username",
        { username: administrator.username, password: "incorrect horse battery" },
        { "X-Forwarded-For": "203.0.113.9" },
      );
      statuses.push(response.status);
    }

    expect(statuses).toEqual([401, 401, 401, 429]);
  });

  it("rejects sign-in from an untrusted origin", async () => {
    const response = await post(
      harness.auth,
      "/sign-in/email",
      { email: administrator.email, password: administrator.password },
      { Origin: "https://evil.example" },
    );

    expect(response.status).toBe(403);
  });

  it.each([
    ["no cookie", new Headers()],
    ["a forged cookie", new Headers({ Cookie: "alcove.session_token=forged" })],
  ])("resolves no user from %s", async (_, headers) => {
    expect(await loadAuthState(harness.auth, headers)).toEqual({ initialized: true, user: null });
  });

  it("extends a session that is due for renewal and refreshes its cookie", async () => {
    const signIn = await post(harness.auth, "/sign-in/email", {
      email: administrator.email,
      password: administrator.password,
    });
    const { cookie } = sessionCookie(signIn);
    const token = sessionToken(cookie);
    // Sessions last 7 days and are renewed once a day, so one with 5 days left is due.
    const dueExpiry = new Date(Date.now() + 5 * day);
    // Timestamps are stored as UTC without a zone, as Drizzle writes them.
    await harness.database.db.$client.query(
      "update session set expires_at = $1::timestamp where token = $2",
      [dueExpiry.toISOString(), token],
    );

    const response = await get(harness.auth, "/get-session", cookie);

    expect(response.status).toBe(200);
    const refreshed = sessionCookie(response);
    expect(sessionToken(refreshed.cookie)).toBe(token);
    expect(refreshed.attributes).toContain(`max-age=${(7 * day) / 1000}`);
    const sessions = await harness.database.db.select().from(session);
    const renewed = sessions.find((row) => row.token === token);
    expect(renewed?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 7 * day - 60_000);
  });

  it("rate-limits sign-in per client, even when NODE_ENV isn't production", async () => {
    expect(process.env.NODE_ENV).not.toBe("production");
    expect((await harness.auth.$context).rateLimit.enabled).toBe(true);
    const attempt = (address: string) =>
      post(
        harness.auth,
        "/sign-in/email",
        { email: administrator.email, password: "incorrect horse battery" },
        { "X-Forwarded-For": address },
      );

    const statuses: number[] = [];
    for (let index = 0; index < 4; index++) statuses.push((await attempt("203.0.113.7")).status);

    // Better Auth's default rule for sign-in: 3 requests per 10 seconds.
    expect(statuses).toEqual([401, 401, 401, 429]);
    expect((await attempt("203.0.113.8")).status).toBe(401);
  });

  // Better Auth's password change applies the same length limits as setup.
  it.each([
    ["PASSWORD_TOO_SHORT", "x".repeat(11)],
    ["PASSWORD_TOO_LONG", "x".repeat(129)],
  ])("rejects a new password with %s", async (code, newPassword) => {
    const response = await post(
      harness.auth,
      "/change-password",
      { currentPassword: administrator.password, newPassword },
      { Cookie: setupCookie },
    );

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe(code);
  });

  it("signs out and invalidates the session", async () => {
    const signIn = await post(harness.auth, "/sign-in/email", {
      email: administrator.email,
      password: administrator.password,
    });
    const { cookie } = sessionCookie(signIn);
    const sessionsBefore = await harness.database.db.$count(session);

    const signOut = await post(harness.auth, "/sign-out", {}, { Cookie: cookie });

    expect(signOut.status).toBe(200);
    expect(await harness.database.db.$count(session)).toBe(sessionsBefore - 1);
    // The old cookie no longer authenticates, even if the browser kept it.
    expect(await loadAuthState(harness.auth, new Headers({ Cookie: cookie }))).toEqual({
      initialized: true,
      user: null,
    });
  });
});
