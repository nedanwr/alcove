# Authentication

Alcove Core authenticates users with [Better Auth](https://www.better-auth.com) using email and password, cookie-based sessions, and Core's PostgreSQL database. This page covers how Alcove uses it. For Better Auth itself, see its documentation.

## Ownership

Core owns authentication. Users, sessions, and credentials live in Core's database, and only Core runs Better Auth. Modules don't run their own authentication, read Core's auth tables, or depend on `@alcove/database`. They will receive the signed-in user from Core through public contracts and SDKs, which don't exist yet.

## Architecture

`apps/core/src/auth/` is a flat directory. Its files fall into these groups:

| Group                          | Files in `auth/`                                                                          | Role                                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Configuration                  | `create-auth.server.ts`, `auth.server.ts`, `env.ts`, `schema.config.ts`, `auth-client.ts` | `createAuth`: the Better Auth configuration; `auth`: the server's instance; the `authEnv` preset; the CLI entry for `pnpm auth:generate`; the browser client |
| Better Auth plugins            | `initial-setup.server.ts`, `account-settings.server.ts`                                   | One-time administrator setup and the administrator role (see below); the account settings rules (see [Settings](settings.md#account-settings))               |
| Auth state and authorization   | `auth-state.ts`, `auth-state.server.ts`, `auth-state.functions.ts`                        | What the client sees (`SessionUser`, `AccountSession`) and the route guards; `loadAuthState`, `requireSession`, and `requireAdministrator`; `getAuthState`   |
| Session management             | `sessions.server.ts`, `sessions.functions.ts`                                             | Listing and signing out the user's sessions without exposing their tokens (see [Settings](settings.md#sessions))                                             |
| Validation and password policy | `validation.ts`, `password-strength.ts`                                                   | Zod schemas and rules shared by the forms and the server, and `safeRedirect`; the advice-only password strength estimate                                     |
| Tests                          | `*.test.ts(x)`, `*.integration.test.ts`, `testing.ts`                                     | Unit tests beside the code they cover; integration tests and their shared helpers (see [Tests](#tests))                                                      |

Some files stay separate because of how they're loaded:

- `create-auth.server.ts` only defines the factory. `auth.server.ts` creates the instance from `~/env` and Core's database, so tests and the Better Auth CLI can use the factory without either.
- `*.functions.ts` files hold TanStack Start server functions, which the client imports as RPC stubs. The logic they call lives in `*.server.ts` files, which import protection keeps out of the client, and which integration tests call without a request.
- `auth-state.ts` and `auth-client.ts` run in the browser, so they never import server code.
- `env.ts` is a T3 Env preset that `~/env` composes, validated and tested on its own.

Elsewhere in `apps/core/src`:

| Path                        | Role                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `components/auth/`          | The sign-in and setup layout and forms, built with TanStack Form     |
| `installation.functions.ts` | `getInstallationHost`: the host shown on the sign-in and setup pages |
| `routes/api/auth/$.ts`      | Mounts Better Auth's HTTP API at `/api/auth/*`                       |
| `routes/_auth/`             | Sign-in and setup pages                                              |
| `routes/_app.tsx`           | The application shell, available only to signed-in users             |

Route protection runs on the server. The root route's `beforeLoad` calls `getAuthState` once per navigation: in-process during server rendering, and as an RPC during client-side navigation. Child routes read the result from router context and redirect before anything renders, so protected pages are never sent to signed-out visitors. The client only receives the user's ID, name, username, email, image, and whether they're the administrator, never the session token.

After signing in or completing setup, the forms call `router.invalidate()`. That reloads the auth state and re-runs the current route's guard, which sends the user on: to the requested page after sign-in, or to the dashboard after setup. Signing out navigates to `/sign-in` explicitly, so the next person to sign in starts from the dashboard rather than the previous user's page, and then clears the router's cache. The router caches loader data for the routes it leaves, so the cache is cleared after the navigation.

Route guards control navigation; they don't protect data. Server functions that return protected data must check the session themselves, with `requireSession` or `requireAdministrator` from `auth/auth-state.server.ts`, inside `runServerFunction` (see [Settings](settings.md#server-functions)).

## Configuration

Set these in `apps/core/.env` for local development (see [`.env.example`](../../apps/core/.env.example)), or in the process environment in production. Both are server-only and validated at startup in [`apps/core/src/auth/env.ts`](../../apps/core/src/auth/env.ts).

| Variable             | Description                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET` | Signs cookies and encrypts auth data. At least 32 characters; generate one with `openssl rand -base64 32`. Changing it signs everyone out.                    |
| `BETTER_AUTH_URL`    | The origin users open Alcove at, such as `http://localhost:3000` or `https://alcove.example.com`. Better Auth trusts only this origin for CSRF and redirects. |

## Database

Better Auth's tables (`user`, `session`, `account`, and `verification`) and Alcove's `installation` table are generated from the Better Auth configuration into `packages/database/src/schema/auth.ts`. After changing the configuration or adding a Better Auth plugin:

```sh
pnpm auth:generate   # regenerate the Drizzle schema with the Better Auth CLI
pnpm db:generate     # generate a SQL migration from it
pnpm db:migrate      # apply it
```

Review the generated migration before committing it. See [Database](database.md) for the migration workflow.

## Forms

The sign-in and setup forms use [TanStack Form](https://tanstack.com/form) with the Zod schemas in `auth/validation.ts`. Fields are validated on submit, then revalidated as they change. On an invalid submit, the first invalid field receives focus. TanStack Form's validators don't return the schema's output, so `onSubmit` parses the values again to send the trimmed and normalized ones.

Form validation is for feedback only. The server stays authoritative: the setup plugin validates the administrator's details with the same schema, and Better Auth validates credentials, usernames, and password length itself.

The sign-in and setup pages share a layout that shows the host from `BETTER_AUTH_URL` and Core's version from `apps/core/package.json`.

### Passwords

Setup lists the password requirements the server enforces, checking them as the password is typed: at least 12 characters, and not containing the username or email (or the email's part before the `@`), ignoring case. Identifiers shorter than 4 characters aren't checked, since they would match too many unrelated passwords. The same requirements apply when a password is changed in settings. They only apply to new passwords, so changing a username or email never invalidates an existing password. It also shows a strength estimate. The estimate is advice only, and any password that meets the requirements is accepted. It credits length and the variety of characters, and discounts repeated characters, sequences such as `abc` or `123`, keyboard runs such as `qwerty`, common passwords (including substitutions such as `p4ssw0rd`), and the user's own details. It is a heuristic, not a measure of how a particular attacker would fare.

## First-run setup

A fresh installation has no users and no default credentials. Until it is initialized, every page redirects to `/setup`, where the first visitor creates the administrator account and is signed in. After that, `/setup` redirects away and setup can never run again.

Setup reuses Better Auth's email sign-up endpoint, so password hashing (scrypt), validation, and session creation are Better Auth's own. The `initialSetup` plugin restricts it:

- Before sign-up runs, it rejects the request with `403 REGISTRATION_CLOSED` if the installation is initialized, and validates the submitted name, username, email, and password.
- Inside the transaction that creates the user, it inserts the single `installation` row under a fixed primary key. Concurrent setup requests serialize on that key: the first commits, and the others fail with a unique violation, roll back their user, and receive `403`. This check runs for every user creation, not just sign-up.

Anyone who can reach a fresh installation can complete setup, so finish it before exposing Alcove to a network you don't control.

## Usernames

Every account created through setup has a username, and people sign in with either their username or their email. Usernames come from Better Auth's [username plugin](https://www.better-auth.com/docs/plugins/username), which adds the unique `user.username` column and the `/sign-in/username` endpoint:

- Usernames are 3 to 32 ASCII letters, numbers, periods, underscores, and hyphens. They must contain a letter, start and end with a letter or number, and can't have separators next to each other (such as `..` or `.-`). `alcove`, `admin`, `administrator`, `root`, `system`, `support`, and `api` are reserved. The rules live in `auth/validation.ts`, shared by the setup form and the plugin's `usernameValidator`.
- Uppercase is accepted, but usernames are stored in lowercase and matched case-insensitively. The validator gives the same answer in any case, so sign-up, sign-in, and future username changes agree. A unique index on `lower(username)` also rejects usernames that differ only in case at the database level.
- Ownership and relationships reference the immutable `user.id`, never the username.
- Usernames can't contain `@`, so the sign-in form sends anything containing one to `/sign-in/email`, and anything else to `/sign-in/username`.
- The plugin's `/is-username-available` endpoint is disabled, because it would let anyone discover which usernames exist.
- The plugin also lets signed-in users change their username through `/update-user`, subject to the same rules and uniqueness. Core also requires the current password (see [Settings](settings.md#account-settings)).

## Administrator

The account created at setup is the administrator: its `user.role` is `admin`, and every other user's is `user`. The role can't be set through any endpoint. The session user sent to the client includes `administrator`, and `requireAdministrator` checks the role on the server. See [Settings](settings.md#administrator).

## Registration

Public registration is closed once setup completes, and the server enforces it: sign-up returns `403` whatever the email or username, so it doesn't reveal which are registered, and the database hook refuses any other path that would create a user. The `initialSetup` plugin is registered before the username plugin, so its check runs before the username plugin can report a taken username. Administrator-managed user creation will have to lift that restriction explicitly when it is added.

## Sessions

- Sessions are stored in the `session` table and identified by a signed, `HttpOnly`, `SameSite=Lax` cookie named `alcove.session_token`. Cookies are `Secure` whenever `BETTER_AUTH_URL` uses `https://`.
- Sessions last 7 days and are extended, at most once a day, while in use. Signing out deletes the session, so its cookie stops working immediately.
- The browser never calls Better Auth's `/get-session`; sessions are read by `getAuthState` on the server. When a session is extended, Better Auth emits a renewed cookie, and the `tanstackStartCookies` plugin forwards it on TanStack Start's response, both for server-rendered pages and for the server function call made on client-side navigation. Without the plugin, the database session would be extended but the browser's cookie would still expire 7 days after sign-in.
- Every sign-in creates a new session token.
- Users can list and sign out their sessions in the devices and sessions settings, and changing the password signs out every other session. Better Auth's `/list-sessions` and `/revoke-session` endpoints are disabled over HTTP, because they expose session tokens to the browser; settings use server functions that identify sessions by ID instead. See [Settings](settings.md#sessions).
- Better Auth's cookie cache is off, so revoked sessions stop working on the next request.

## Security

- **CSRF and redirects:** Better Auth checks the `Origin` of state-changing requests and the targets of callback URLs against `BETTER_AUTH_URL`. Alcove keeps these checks on even in test environments, where Better Auth would otherwise skip them. Post-sign-in `redirect` parameters are reduced to same-origin paths.
- **Credentials:** email sign-in returns the same `401 INVALID_EMAIL_OR_PASSWORD` for unknown emails and wrong passwords, and username sign-in the same `401 INVALID_USERNAME_OR_PASSWORD` for unknown usernames and wrong passwords. For unknown accounts, both still hash the password, so response times don't reveal whether an account exists. The sign-in form shows one message for either. Passwords must be 12 to 128 characters, which Better Auth also enforces when a password is changed, and at setup can't contain the username or email.
- **Rate limiting:** always on. Better Auth would only enable it when `NODE_ENV=production`, which the server build doesn't set. It uses Better Auth's default limits: 100 requests per 10 seconds per client IP, and 3 per 10 seconds for sign-in (by email or username), sign-up, password changes, and email changes. Core adds the same 3 per 10 seconds for `/update-user`, which checks the current password when the username changes.
  - Counters are kept in memory, per process. They reset on restart, and multiple Core replicas would each enforce their own limits, so running replicas will require a shared rate-limit store.
  - Better Auth reads the client IP from a single-address `X-Forwarded-For` header and ignores multi-hop chains, which clients can spoof. When it can't resolve an IP, all clients share one limit. Deployments behind a reverse proxy will need [`advanced.ipAddress`](https://www.better-auth.com/docs/concepts/rate-limit#connecting-ip-address) configured for their proxy.
- **Errors:** TanStack Start sends a thrown error's message to the browser, both in server-rendered pages and in server function responses, and database errors include the failed SQL and its parameters. `getAuthState` logs the original error on the server and throws a generic one in its place, and `runServerFunction` does the same for other server functions. Better Auth's endpoints already do the same, returning an empty `500`. Server functions that read the database must not let its errors reach the browser either.
- **Telemetry** is disabled.

## Tests

`pnpm test` doesn't need PostgreSQL. It covers environment validation, the shared validation rules, the password strength estimate, redirect sanitization, the route guards, and the sign-in and setup forms, which run in [happy-dom](https://github.com/capricorn86/happy-dom) with Testing Library.

`pnpm --filter @alcove/core test:integration` needs PostgreSQL (see [Database tests](database.md#tests)). It builds Core first, then runs:

- `auth/settings.integration.test.ts`: account, session, and instance settings, including reauthentication and authorization. See [Settings](settings.md#tests).
- `auth/auth.integration.test.ts`: Better Auth's HTTP handler against a disposable database. Covers setup, concurrent setup, closed registration (including taken usernames), email and username sign-in, rate limiting, session renewal, and sign-out. Each request uses its own `X-Forwarded-For` address, as separate clients would, so tests don't share rate limits.
- `server.integration.test.ts`: the built production server (`.output/server/index.mjs`, started without `NODE_ENV`) against a disposable database. Covers server-rendered page content, including the configured host and Core's version, the real route guards, setup closing, renewed session cookies forwarded from both server rendering and the `getAuthState` server function, and TanStack Start's rejection of cross-site server function calls. A second server, whose database is unreachable, checks that pages and server function responses show a generic error while the server log keeps the details.
