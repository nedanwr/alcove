// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { randomUUID } from "node:crypto";

import { account, session, user } from "@alcove/database/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadAuthState } from "~/auth/auth-state.server";
import {
  listAccountSessions,
  revokeAccountSession,
  revokeOtherAccountSessions,
} from "~/auth/sessions.server";
import {
  administrator,
  createHarness,
  errorCode,
  post,
  sessionCookie,
  sessionToken,
  type Harness,
} from "~/auth/testing";
import {
  getInstallationName,
  getInstallationRecord,
  updateInstallation,
} from "~/installation.server";

const member = {
  name: "Grace Hopper",
  username: "grace",
  email: "grace@example.com",
  password: "cobol compiler 1959",
};

async function setUp(harness: Harness) {
  const response = await post(harness.auth, "/sign-up/email", administrator);
  if (!response.ok) throw new Error(`Setup failed with status ${response.status}`);
  return sessionCookie(response).cookie;
}

async function signIn(harness: Harness, email: string, password: string) {
  const response = await post(harness.auth, "/sign-in/email", { email, password });
  if (!response.ok) throw new Error(`Sign-in failed with status ${response.status}`);
  return sessionCookie(response).cookie;
}

// Inserted directly: registration is closed after setup and Core can't add users yet.
async function addMember(harness: Harness) {
  const { password } = await harness.auth.$context;
  const id = randomUUID();
  await harness.database.db.insert(user).values({
    id,
    name: member.name,
    username: member.username,
    email: member.email,
  });
  await harness.database.db.insert(account).values({
    id: randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await password.hash(member.password),
    updatedAt: new Date(),
  });
  return signIn(harness, member.email, member.password);
}

function cookieHeaders(cookie: string) {
  return new Headers({ Cookie: cookie });
}

async function signedInUser(harness: Harness, cookie: string) {
  return (await loadAuthState(harness.auth, cookieHeaders(cookie))).user;
}

async function storedUser(harness: Harness, email: string) {
  const [row] = await harness.database.db.select().from(user).where(eq(user.email, email));
  return row;
}

async function sessionId(harness: Harness, cookie: string) {
  const [row] = await harness.database.db
    .select({ id: session.id })
    .from(session)
    .where(eq(session.token, sessionToken(cookie)));
  if (!row) throw new Error("No session for the cookie");
  return row.id;
}

describe("account settings", () => {
  let harness: Harness;
  let cookie: string;
  let memberCookie: string;
  const current = { ...administrator };

  beforeAll(async () => {
    harness = await createHarness();
    cookie = await setUp(harness);
    memberCookie = await addMember(harness);
  });

  afterAll(async () => {
    await harness.database.drop();
  });

  function update(body: unknown, as = cookie) {
    return post(harness.auth, "/update-user", body, { Cookie: as });
  }

  it("makes the user created at setup the administrator", async () => {
    expect((await storedUser(harness, administrator.email))?.role).toBe("admin");
    expect(await signedInUser(harness, cookie)).toMatchObject({
      username: "ada",
      administrator: true,
    });
    expect(await signedInUser(harness, memberCookie)).toMatchObject({ administrator: false });
  });

  it("changes the name without the password, trimmed", async () => {
    const response = await update({ name: "  Ada King " });

    expect(response.status).toBe(200);
    expect((await storedUser(harness, current.email))?.name).toBe("Ada King");
  });

  it.each([
    ["a blank name", { name: " " }],
    ["an image", { image: "https://evil.example/tracker.png" }],
    ["an email", { email: "mallory@example.com" }],
  ])("rejects %s", async (_, body) => {
    const response = await update(body);

    expect(response.status).toBe(400);
    expect((await storedUser(harness, current.email))?.name).toBe("Ada King");
  });

  it("doesn't let a user make themselves the administrator", async () => {
    const response = await update({ role: "admin" }, memberCookie);

    expect(response.status).toBe(400);
    expect((await storedUser(harness, member.email))?.role).toBe("user");
  });

  it("rejects changes without a session", async () => {
    const response = await post(harness.auth, "/update-user", { name: "Mallory" });

    expect(response.status).toBe(401);
  });

  it.each([
    ["no password", {}],
    ["a wrong password", { currentPassword: "incorrect horse battery" }],
  ])("requires the current password to change the username, rejecting %s", async (_, extra) => {
    const response = await update({ username: "ada.king", ...extra });

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("INVALID_PASSWORD");
    expect((await storedUser(harness, current.email))?.username).toBe("ada");
  });

  it("checks the password before revealing whether a username is taken", async () => {
    const response = await update({ username: member.username, currentPassword: "wrong password" });

    expect(await errorCode(response)).toBe("INVALID_PASSWORD");
  });

  it("rejects a username that's taken", async () => {
    const response = await update({
      username: "GRACE",
      currentPassword: current.password,
    });

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("USERNAME_IS_ALREADY_TAKEN");
  });

  it("rejects a username that breaks the username policy", async () => {
    const response = await update({ username: "admin", currentPassword: current.password });

    expect(response.status).toBe(400);
    expect((await storedUser(harness, current.email))?.username).toBe("ada");
  });

  it("changes the username with the current password, in lowercase", async () => {
    const response = await update({ username: "Ada.King", currentPassword: current.password });

    expect(response.status).toBe(200);
    expect((await storedUser(harness, current.email))?.username).toBe("ada.king");
    const signInResponse = await post(harness.auth, "/sign-in/username", {
      username: "ada.king",
      password: current.password,
    });
    expect(signInResponse.status).toBe(200);
  });

  it.each([
    ["no password", {}],
    ["a wrong password", { currentPassword: "incorrect horse battery" }],
  ])("requires the current password to change the email, rejecting %s", async (_, extra) => {
    const response = await post(
      harness.auth,
      "/change-email",
      { newEmail: "ada@example.org", ...extra },
      { Cookie: cookie },
    );

    expect(response.status).toBe(400);
    expect(await storedUser(harness, "ada@example.org")).toBeUndefined();
  });

  it("reports an email that belongs to another account", async () => {
    const response = await post(
      harness.auth,
      "/change-email",
      { newEmail: "Grace@Example.com", currentPassword: current.password },
      { Cookie: cookie },
    );

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("EMAIL_UNAVAILABLE");
    expect((await storedUser(harness, member.email))?.username).toBe(member.username);
  });

  it("changes the email with the current password, in lowercase", async () => {
    const response = await post(
      harness.auth,
      "/change-email",
      { newEmail: "Ada@Example.org", currentPassword: current.password },
      { Cookie: cookie },
    );

    expect(response.status).toBe(200);
    expect((await storedUser(harness, "ada@example.org"))?.username).toBe("ada.king");
    current.email = "ada@example.org";
    expect(await signIn(harness, current.email, current.password)).toBeTruthy();
    expect(await signedInUser(harness, cookie)).toMatchObject({ email: current.email });
  });

  it.each([
    ["the username", "ada.king forever"],
    ["the email", "Ada@Example.org rocks"],
  ])("rejects a new password containing %s", async (_, newPassword) => {
    const response = await post(
      harness.auth,
      "/change-password",
      { currentPassword: current.password, newPassword },
      { Cookie: cookie },
    );

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("PASSWORD_CONTAINS_IDENTITY");
  });

  it("rejects a wrong current password", async () => {
    const response = await post(
      harness.auth,
      "/change-password",
      { currentPassword: "incorrect horse battery", newPassword: "staple orbit lantern" },
      { Cookie: cookie },
    );

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("INVALID_PASSWORD");
  });

  it("changes the password and signs out the other sessions, even if asked not to", async () => {
    const otherCookie = await signIn(harness, current.email, current.password);

    const response = await post(
      harness.auth,
      "/change-password",
      {
        currentPassword: current.password,
        newPassword: "staple orbit lantern",
        revokeOtherSessions: false,
      },
      { Cookie: cookie },
    );

    expect(response.status).toBe(200);
    expect(await signedInUser(harness, otherCookie)).toBeNull();
    expect(await signedInUser(harness, memberCookie)).not.toBeNull();
    // The session that changed the password continues with a new cookie.
    cookie = sessionCookie(response).cookie;
    expect(await signedInUser(harness, cookie)).toMatchObject({ email: current.email });
    await expect(signIn(harness, current.email, current.password)).rejects.toThrow(
      "Sign-in failed with status 401",
    );
    current.password = "staple orbit lantern";
    expect(await signIn(harness, current.email, current.password)).toBeTruthy();
  });
});

describe("session management", () => {
  let harness: Harness;
  let cookie: string;
  let memberCookie: string;

  beforeAll(async () => {
    harness = await createHarness();
    cookie = await setUp(harness);
    memberCookie = await addMember(harness);
  });

  afterAll(async () => {
    await harness.database.drop();
  });

  it("lists the user's active sessions, current first, without their tokens", async () => {
    const other = await signIn(harness, administrator.email, administrator.password);

    const sessions = await listAccountSessions(harness.auth, cookieHeaders(cookie));

    expect(sessions.map(({ id, current }) => ({ id, current }))).toEqual([
      { id: await sessionId(harness, cookie), current: true },
      { id: await sessionId(harness, other), current: false },
    ]);
    const serialized = JSON.stringify(sessions);
    expect(serialized).not.toContain(sessionToken(cookie));
    expect(serialized).not.toContain(sessionToken(other));
    expect(serialized).not.toContain(await sessionId(harness, memberCookie));
  });

  it("signs out another session by its ID", async () => {
    const other = await signIn(harness, administrator.email, administrator.password);

    await revokeAccountSession(
      harness.auth,
      cookieHeaders(cookie),
      await sessionId(harness, other),
    );

    expect(await signedInUser(harness, other)).toBeNull();
    expect(await signedInUser(harness, cookie)).not.toBeNull();
  });

  it("refuses to end the current session, which signing out does", async () => {
    await expect(
      revokeAccountSession(harness.auth, cookieHeaders(cookie), await sessionId(harness, cookie)),
    ).rejects.toMatchObject({ status: 400 });
    expect(await signedInUser(harness, cookie)).not.toBeNull();
  });

  it("can't sign out another user's session", async () => {
    await revokeAccountSession(
      harness.auth,
      cookieHeaders(cookie),
      await sessionId(harness, memberCookie),
    );

    expect(await signedInUser(harness, memberCookie)).not.toBeNull();
  });

  it("signs out every other session", async () => {
    const others = [
      await signIn(harness, administrator.email, administrator.password),
      await signIn(harness, administrator.email, administrator.password),
    ];

    await revokeOtherAccountSessions(harness.auth, cookieHeaders(cookie));

    for (const other of others) expect(await signedInUser(harness, other)).toBeNull();
    expect(await signedInUser(harness, cookie)).not.toBeNull();
    expect(await signedInUser(harness, memberCookie)).not.toBeNull();
    expect(await listAccountSessions(harness.auth, cookieHeaders(cookie))).toHaveLength(1);
  });

  it("requires a session", async () => {
    await expect(listAccountSessions(harness.auth, new Headers())).rejects.toMatchObject({
      status: 401,
    });
    await expect(revokeOtherAccountSessions(harness.auth, new Headers())).rejects.toMatchObject({
      status: 401,
    });
  });

  it("doesn't serve Better Auth's token-based session endpoints over HTTP", async () => {
    const list = await harness.auth.handler(
      new Request("http://localhost:3000/api/auth/list-sessions", {
        headers: cookieHeaders(cookie),
      }),
    );
    const revoke = await post(
      harness.auth,
      "/revoke-session",
      { token: sessionToken(memberCookie) },
      { Cookie: cookie },
    );

    expect(list.status).toBe(404);
    expect(revoke.status).toBe(404);
  });
});

describe("instance settings", () => {
  let harness: Harness;
  let cookie: string;
  let memberCookie: string;

  beforeAll(async () => {
    harness = await createHarness();
    cookie = await setUp(harness);
    memberCookie = await addMember(harness);
  });

  afterAll(async () => {
    await harness.database.drop();
  });

  it("starts with the default name and the setup date", async () => {
    const record = await getInstallationRecord(
      harness.auth,
      harness.database.db,
      cookieHeaders(cookie),
    );

    expect(record.name).toBe("Alcove");
    expect(record.initializedAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it("lets the administrator rename the installation", async () => {
    await updateInstallation(harness.auth, harness.database.db, cookieHeaders(cookie), {
      name: "Lovelace Labs",
    });

    expect(
      await getInstallationName(harness.auth, harness.database.db, cookieHeaders(memberCookie)),
    ).toBe("Lovelace Labs");
  });

  it("refuses instance settings to users who aren't the administrator", async () => {
    await expect(
      getInstallationRecord(harness.auth, harness.database.db, cookieHeaders(memberCookie)),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      updateInstallation(harness.auth, harness.database.db, cookieHeaders(memberCookie), {
        name: "Mallory",
      }),
    ).rejects.toMatchObject({ status: 403 });

    expect(
      await getInstallationName(harness.auth, harness.database.db, cookieHeaders(cookie)),
    ).toBe("Lovelace Labs");
  });

  it("refuses signed-out visitors", async () => {
    const signedOut = new Headers();

    await expect(
      getInstallationName(harness.auth, harness.database.db, signedOut),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      updateInstallation(harness.auth, harness.database.db, signedOut, { name: "Mallory" }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
