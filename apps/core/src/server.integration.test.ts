// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

import { databaseEnv } from "@alcove/database/env";
import { session } from "@alcove/database/schema";
import { createTestDatabase, type TestDatabase } from "@alcove/database/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { version } from "../package.json";

// Smoke tests for the production server, the same entry point Docker runs, against a migrated test
// database. They exercise the real routes, guards, and cookie handling rather than a test router.
// `pnpm test:integration` builds the server first.

const entry = fileURLToPath(new URL("../.output/server/index.mjs", import.meta.url));
const day = 24 * 60 * 60 * 1000;
const administrator = {
  name: "Ada Lovelace",
  username: "ada",
  email: "ada@example.com",
  password: "correct horse battery",
};

// TanStack Start addresses server functions by a hash of their file and export. If its scheme
// changes, the server function tests fail with a 404 rather than passing.
const getAuthStateId = createHash("sha256")
  .update("src/auth/auth-state.functions.ts--getAuthState_createServerFn_handler")
  .digest("hex");

interface Server {
  origin: string;
  /** Everything the server has written to stdout and stderr. */
  output: () => string;
  stop: () => void;
}

let database: TestDatabase;
let server: Server;
let origin: string;
let cookie: string;

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer().listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() =>
        typeof address === "object" && address
          ? resolve(address.port)
          : reject(new Error("No port")),
      );
    });
  });
}

async function startServer(databaseUrl: string): Promise<Server> {
  const port = await freePort();
  const serverOrigin = `http://127.0.0.1:${port}`;
  const { NODE_ENV: _, ...env } = process.env;
  const child = spawn(process.execPath, [entry], {
    // No `NODE_ENV`, as when the entry point is run directly.
    env: {
      ...env,
      HOST: "127.0.0.1",
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
      BETTER_AUTH_URL: serverOrigin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));

  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(serverOrigin, { redirect: "manual" });
      return { origin: serverOrigin, output: () => output, stop: () => child.kill() };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  child.kill();
  throw new Error(`The server didn't start:\n${output}`);
}

function request(path: string, headers: Record<string, string> = {}, base = origin) {
  return fetch(`${base}${path}`, { redirect: "manual", headers });
}

function serverFunction(id: string, headers: Record<string, string> = {}, base = origin) {
  return request(`/_serverFn/${id}`, { "x-tsr-serverFn": "true", ...headers }, base);
}

async function serverRendered(response: Response) {
  const html = await response.text();
  // React marks a Suspense boundary that failed during server rendering with `<!--$!-->` and
  // renders its content in the browser instead.
  expect(html).not.toContain("<!--$!-->");
  return html;
}

function sessionCookie(response: Response) {
  const header = response.headers
    .getSetCookie()
    .find((value) => value.startsWith("alcove.session_token="));
  return header ? { cookie: header.split(";")[0] ?? "", attributes: header.toLowerCase() } : null;
}

/** Makes the signed-in session due for renewal, which happens once it is a day old. */
async function ageSession() {
  const token = decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1)).split(".")[0];
  const dueExpiry = new Date(Date.now() + 5 * day);
  await database.db.$client.query(
    "update session set expires_at = $1::timestamp where token = $2",
    [dueExpiry.toISOString(), token],
  );
  return token;
}

async function expiry(token: string | undefined) {
  const rows = await database.db.select().from(session);
  return rows.find((row) => row.token === token)?.expiresAt.getTime() ?? 0;
}

beforeAll(async () => {
  if (!existsSync(entry)) throw new Error("Build Core first: pnpm --filter @alcove/core build");

  database = await createTestDatabase(databaseEnv(process.env).DATABASE_URL);
  server = await startServer(database.url);
  origin = server.origin;
});

afterAll(async () => {
  server?.stop();
  await database?.drop();
});

describe("production server", () => {
  it("sends every page of a fresh installation to setup", async () => {
    for (const path of ["/", "/drive", "/sign-in"]) {
      const response = await request(path);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("/setup");
    }

    const setup = await request("/setup");
    expect(setup.status).toBe(200);
    expect(setup.headers.get("cache-control")).toContain("no-store");
    const html = await serverRendered(setup);
    expect(html).toContain("Create administrator account");
    // The configured host and Core's version, rather than placeholders.
    expect(html).toContain(new URL(origin).host);
    expect(html).toContain(`Alcove Core ${version}`);
  });

  it("closes setup once the administrator exists", async () => {
    const signUp = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(administrator),
    });
    expect(signUp.status).toBe(200);
    cookie = sessionCookie(signUp)?.cookie ?? "";

    expect((await request("/setup")).headers.get("location")).toBe("/sign-in");
    expect((await request("/setup", { Cookie: cookie })).headers.get("location")).toBe("/");
  });

  it("sends signed-out visitors to sign-in, remembering the page", async () => {
    const response = await request("/drive?sort=name");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/sign-in?redirect=%2Fdrive%3Fsort%3Dname");

    const signIn = await request("/sign-in?redirect=%2Fdrive%3Fsort%3Dname");
    expect(signIn.status).toBe(200);
    expect(await serverRendered(signIn)).toContain(
      "Enter your email or username and your password.",
    );
  });

  it("renders protected pages for signed-in users", async () => {
    const response = await request("/drive", { Cookie: cookie });

    expect(response.status).toBe(200);
    const html = await serverRendered(response);
    expect(html).toContain("Drive is not available yet");
    // The user resolved on the server for this request is serialized into the page.
    expect(html).toContain(administrator.email);
  });

  it("forwards a renewed session cookie from server rendering", async () => {
    const token = await ageSession();

    const response = await request("/drive", { Cookie: cookie });

    expect(response.status).toBe(200);
    const refreshed = sessionCookie(response);
    expect(refreshed?.cookie).toBe(cookie);
    expect(refreshed?.attributes).toContain(`max-age=${(7 * day) / 1000}`);
    expect(refreshed?.attributes).toContain("httponly");
    expect(await expiry(token)).toBeGreaterThan(Date.now() + 7 * day - 60_000);
  });

  it("forwards a renewed session cookie from the server function used on navigation", async () => {
    const token = await ageSession();

    const response = await serverFunction(getAuthStateId, {
      Cookie: cookie,
      "Sec-Fetch-Site": "same-origin",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(sessionCookie(response)?.attributes).toContain(`max-age=${(7 * day) / 1000}`);
    expect(await expiry(token)).toBeGreaterThan(Date.now() + 7 * day - 60_000);
  });

  it("rejects cross-site server function calls", async () => {
    const response = await serverFunction(getAuthStateId, {
      Cookie: cookie,
      "Sec-Fetch-Site": "cross-site",
    });

    expect(response.status).toBe(403);
  });
});

describe("production server without its database", () => {
  const password = randomBytes(16).toString("hex");
  let unavailable: Server;

  beforeAll(async () => {
    // Nothing listens on a free port, so every query fails to connect.
    unavailable = await startServer(
      `postgresql://alcove:${password}@127.0.0.1:${await freePort()}/alcove`,
    );
  });

  afterAll(() => unavailable?.stop());

  function expectNoInternals(body: string) {
    for (const internal of [
      "Failed query",
      "params:",
      '"installation"',
      "ECONNREFUSED",
      password,
    ]) {
      expect(body).not.toContain(internal);
    }
    expect(body).not.toMatch(/select .+ from/i);
    expect(body).not.toMatch(/\bat .+\.m?js:\d+/);
  }

  it("renders a generic error page", async () => {
    const response = await request("/drive", {}, unavailable.origin);

    expect(response.status).toBe(500);
    const html = await response.text();
    expect(html).toContain("Alcove couldn't check your session.");
    expectNoInternals(html);
  });

  it("returns a generic error from the server function", async () => {
    const response = await serverFunction(
      getAuthStateId,
      { "Sec-Fetch-Site": "same-origin" },
      unavailable.origin,
    );

    const body = await response.text();
    expect(body).toContain("Alcove couldn't check your session.");
    expectNoInternals(body);
  });

  it("keeps the details in the server log", () => {
    expect(unavailable.output()).toContain("Couldn't load the auth state");
    expect(unavailable.output()).toContain("Failed query");
    expect(unavailable.output()).toContain("ECONNREFUSED");
  });
});
