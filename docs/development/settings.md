# Settings

Core's settings live at `/settings`, inside the application shell. They are split in two, and the split is enforced on the server as well as in navigation:

- **Account settings** apply to the signed-in user: their name, sign-in details, password, and sessions. Every signed-in user has them.
- **Instance settings** apply to the whole installation and everyone who uses it. Only the administrator sees or changes them.

| Page             | Route                | Contents                                                     |
| ---------------- | -------------------- | ------------------------------------------------------------ |
| Account          | `/settings/account`  | Name; username and email, which require the current password |
| Security         | `/settings/security` | Password change; active sessions, which can be signed out    |
| Instance (admin) | `/settings/instance` | Installation name; address, Core version, and setup date     |

`/settings` redirects to `/settings/account`. The user menu links to account settings, and the sidebar footer links to `/settings`.

Settings are deliberately not a generic framework: each setting is a form with its own schema and endpoint. Add a new setting where it belongs (account settings to Better Auth or the `user` table, instance settings to the `installation` row) rather than building a key-value store.

## Architecture

| Path (in `apps/core/src`)         | Role                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `routes/_app/settings.tsx`        | The settings layout and its navigation                                                          |
| `routes/_app/settings/`           | The account, security, and instance pages, and the `/settings` redirect                         |
| `components/settings/`            | The settings forms, the session list, and the layout, built with TanStack Form and `@alcove/ui` |
| `auth/account-settings.server.ts` | Better Auth plugin that enforces the account rules on Better Auth's endpoints (see below)       |
| `auth/auth-state.server.ts`       | `requireSession` and `requireAdministrator` for server functions, beside `loadAuthState`        |
| `auth/sessions.server.ts`         | Lists and revokes the signed-in user's sessions without exposing their tokens                   |
| `auth/sessions.functions.ts`      | Server functions for the session list                                                           |
| `installation.ts`                 | The instance settings schema, shared by the form and the server                                 |
| `installation.server.ts`          | Reads and writes the `installation` row, checking the caller's role                             |
| `installation.functions.ts`       | Server functions for the installation name and instance settings                                |
| `server-function.server.ts`       | `runServerFunction`: no caching, response statuses, and safe errors for server functions        |

Account changes go straight to Better Auth's endpoints through its client (`authClient.updateUser`, `changeEmail`, and `changePassword`), so Better Auth's validation, hashing, session cookies, and username plugin all apply. Session management and instance settings use TanStack Start server functions, which check the session themselves: route guards only steer navigation.

After a change, the page calls `router.invalidate()`, which reloads the auth state (shown in the header's user menu) and the page's loader.

## Account settings

The `accountSettings` plugin applies Alcove's rules to Better Auth's endpoints, so they hold for any caller, not just the forms:

| Endpoint           | Accepts                          | Requires the current password  | Also checks                                            |
| ------------------ | -------------------------------- | ------------------------------ | ------------------------------------------------------ |
| `/update-user`     | `name`, `username`; nothing else | When the username changes      | Name and username rules from setup                     |
| `/change-email`    | `newEmail`                       | Always                         | The email isn't used by another account                |
| `/change-password` | `currentPassword`, `newPassword` | Always (Better Auth checks it) | The new password doesn't contain the username or email |

- **Validation:** names, usernames, emails, and new passwords follow the same rules as setup, from the shared schemas in `auth/validation.ts`. Usernames are still stored in lowercase and must be unique (see [Usernames](authentication.md#usernames)). Requests with any other field, such as `image`, `email`, or `role`, are rejected.
- **Reauthentication:** changing the username or email, the identifiers people sign in with, requires the current password, which the plugin verifies against the credential account like Better Auth's password change does. The password is checked before the username plugin reports whether a username is taken. The client sends it through `fetchOptions.body`, since Better Auth's client types don't include it.
- **Emails** change immediately, because Alcove doesn't send email yet and so never verifies addresses (`user.changeEmail.updateEmailWithoutVerification`). Better Auth's change email endpoint would report success for an email that belongs to another account without changing anything; the plugin reports `400 EMAIL_UNAVAILABLE` instead. Only a signed-in user who knows their password can learn this, and the endpoint is rate-limited.
- **Passwords:** changing the password always signs out every other session: the plugin sets `revokeOtherSessions: true` whatever the request asks. The current session continues with a new cookie.
- **Rate limits:** Better Auth limits `/change-password` and `/change-email` to 3 requests per 10 seconds per client. `/update-user` also verifies passwords now, so Core gives it the same limit.

The name and sign-in details are separate forms. Changing both the username and the email calls two endpoints, so one can succeed while the other fails; the form reports which change was saved.

## Sessions

The security page lists the user's active sessions with their browser and system (a hint derived from the user agent), IP address, sign-in time, and expiry, and lets them sign out any session but the current one, or every other session at once. To end the current session, people sign out.

Session tokens never reach the browser. Better Auth's `/list-sessions` and `/revoke-session` endpoints return or take tokens, so they're disabled over HTTP (`disabledPaths`). Instead, `listAccountSessions` reads sessions through Better Auth's internal adapter and returns them without tokens, and `revokeAccountSession` takes a session ID, finds the token among the user's own sessions, and calls `auth.api.revokeSession`. An ID that isn't one of the user's sessions does nothing. `revokeOtherAccountSessions` calls `auth.api.revokeOtherSessions`.

Listing sessions doesn't use `auth.api.listSessions`, which refuses sessions created more than a day ago (Better Auth's `freshAge`), so the list stays available for a session's whole lifetime. Signing sessions out doesn't require reauthentication, since it only removes access.

## Instance settings

Instance settings are columns of the single `installation` row that setup creates:

- `name`: the installation's name, `Alcove` by default, up to 64 characters. The sidebar shows it to every signed-in user; `_app.tsx` loads it once per page load and reloads it when the router is invalidated.

The instance page also shows read-only facts: the address from `BETTER_AUTH_URL`, Core's version, and when setup completed.

### Administrator

Setup makes the account it creates the administrator, by setting `user.role` to `admin` inside the same transaction. Every other user gets the default role, `user`. The field is declared by the `initialSetup` plugin with `input: false`, so no endpoint accepts it, and it is named and valued like Better Auth's admin plugin, so that plugin can adopt it later. Migration `0004_administrator_role` makes users created before roles existed the administrator, since setup was the only way to create them.

The client receives `administrator: true` or `false` in the session user. `/settings/instance` redirects anyone else to `/settings/account`, and the navigation hides it, but the server functions check the role themselves with `requireAdministrator` from `auth/auth-state.server.ts`, responding with `403`.

## Server functions

Settings server functions wrap their body in `runServerFunction`, which:

- marks the response `Cache-Control: private, no-store`;
- passes through a `PublicError`, whose message is safe to show, and responds with its status (`401` without a session, `403` for a non-administrator);
- logs any other error and replaces it with a generic message and a `500`, so database errors never reach the browser.

TanStack Start would otherwise serialize a thrown error into a `200` response with its full message.

## Tests

- `pnpm test` covers the settings schemas, the forms and session list (in happy-dom), the user agent descriptions, the instance route guard, and `runServerFunction`.
- `auth/settings.integration.test.ts` runs Better Auth and the settings logic against a disposable database: name, username, email, and password changes and their reauthentication, rejected fields and roles, session listing and revocation (including other users' sessions and the disabled endpoints), and instance settings for the administrator, other users, and signed-out visitors. Shared helpers live in `auth/testing.ts`.
- `server.integration.test.ts` renders the settings pages from the production build, checks that the installation name appears in the shell, and that the instance settings server function responds with `401` to signed-out visitors.
- `packages/database/src/migrations.integration.test.ts` checks that migrating an existing installation makes its user the administrator.

## Not yet included

Settings don't cover module management, licensing, user management or invitations, public registration, outbound email (and so email verification and password recovery), or deployment configuration.
