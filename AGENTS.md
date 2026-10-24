# AGENTS.md

Instructions for coding agents working in the Alcove repository. Alcove is a modular, Docker-first, self-hosted productivity platform. See [`README.md`](README.md) for the project overview.

## Repository layout

| Path                 | Contents                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `apps/core/`         | Alcove Core (`@alcove/core`): TanStack Start app, Vite, Nitro, Tailwind CSS                 |
| `packages/ui/`       | Shared UI (`@alcove/ui`): shadcn components on Base UI, hooks, utilities, global styles     |
| `packages/database/` | Core's PostgreSQL foundation (`@alcove/database`): Drizzle client, env preset, migrations   |
| `modules/*`          | Independent Alcove modules (workspace members)                                              |
| `tooling/*`          | Internal build and development tooling (workspace members)                                  |
| `templates/`         | Developer templates; intentionally outside the pnpm workspace, must work as standalone apps |
| `examples/`          | Developer examples; intentionally outside the pnpm workspace, must work as standalone apps  |

Some directories referenced here and in [`LICENSES.md`](LICENSES.md) do not exist yet. Workspace membership is defined in [`pnpm-workspace.yaml`](pnpm-workspace.yaml); task wiring in [`turbo.json`](turbo.json).

## Commands

Run from the repository root. Requires Node.js 24+ and the pnpm version pinned in `packageManager`.

```sh
pnpm install
pnpm dev            # turbo run dev
pnpm build          # turbo run build
pnpm format         # oxfmt (write)
pnpm format:check   # oxfmt --check
pnpm lint           # oxlint --deny-warnings
pnpm lint:fix       # oxlint --fix
pnpm typecheck      # turbo run typecheck
pnpm test           # turbo run test
pnpm check          # format:check + lint + typecheck + test
pnpm db:generate    # generate SQL migrations (drizzle-kit)
pnpm db:migrate     # apply migrations to DATABASE_URL
pnpm db:check       # check migration consistency
```

Local PostgreSQL, `DATABASE_URL`, migrations, and integration tests are documented in [`docs/development/database.md`](docs/development/database.md).

Scope a task to one package with `pnpm --filter <name> <script>`, for example `pnpm --filter @alcove/core typecheck`.

## Git

- Never create, amend, or squash commits, push, merge, rebase, or delete branches unless explicitly instructed.
- Do not switch or create branches unless requested.
- Do not discard, reset, stash, or overwrite changes you did not make. Assume unrelated changes in the working tree belong to the user.
- When asked to commit, follow [`docs/contributing/commits.md`](docs/contributing/commits.md) and include a DCO `Signed-off-by` trailer, as described in [`CONTRIBUTING.md`](.github/CONTRIBUTING.md#developer-certificate-of-origin-dco). Commits must also be cryptographically signed: rely on the user's Git signing configuration and never bypass it (for example with `--no-gpg-sign`).

## TypeScript and type safety

- All packages extend [`tsconfig.base.json`](tsconfig.base.json), which enables `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `erasableSyntaxOnly`. Keep these settings; write code that satisfies them.
- Prefer strongly typed, type-safe implementations. Avoid `any`, unsafe `as` casts, non-null assertions (`!`), `@ts-ignore`, and `@ts-expect-error`. Use `unknown` and narrow it.
- Use `import type` (or inline `type` specifiers) for type-only imports. Avoid enums, namespaces, and parameter properties (`erasableSyntaxOnly`).
- Rely on inference where it keeps code readable. Annotate exported API boundaries and places where inference would be unclear; skip redundant annotations.
- Validate untrusted data (request input, environment variables, storage, external APIs) at runtime with Zod rather than trusting static types. Declare environment variables in [`apps/core/src/env.ts`](apps/core/src/env.ts).
- Never weaken TypeScript, Oxlint, or Oxfmt settings, or add disable comments, to silence errors. Fix the underlying issue.

## Tooling

- Use pnpm and the existing root and Turborepo scripts. Do not use npm, Yarn, or Bun.
- Lint with Oxlint ([`.oxlintrc.json`](.oxlintrc.json)) and format with Oxfmt ([`.oxfmtrc.json`](.oxfmtrc.json)). Never introduce ESLint, Prettier, or Biome.
- Write tests with Vitest.
- Preserve existing configuration. Change it only when necessary, and explain why.
- After making changes, run the relevant checks (at minimum format, lint, and typecheck for affected packages; tests when behavior changes), or `pnpm check` for broad changes.

## Architecture

- Alcove has three levels: **Core** (auth, permissions, configuration, licensing, module management), **Modules** (independent products), and **Plugins** (optional extensions to modules). Respect these boundaries.
- Modules are deployed independently. Do not statically import module code into Core or Core code into modules; integrate through public contracts and SDKs.
- Put reusable UI components, hooks, and styles in `packages/ui`. Put Core-specific screens, layouts, and components in `apps/core`.
- `packages/database` belongs to Core. Keep database access server-only (`*.server.ts` in `apps/core`), and do not let modules depend on it. Generate migrations with drizzle-kit; never hand-edit generated migration metadata or rely on `drizzle-kit push`.
- Reuse existing workspace packages instead of duplicating shared functionality. Do not add dependencies or abstractions without a clear need.
- Preserve import conventions and package exports:
  - `apps/core` imports its own files through the `~/*` alias, and shared UI through `@alcove/ui/...` package exports.
  - `packages/ui` uses `#ui/*` subpath imports internally. Its public surface is the `exports` map in [`packages/ui/package.json`](packages/ui/package.json).
  - Add shadcn components with the shadcn CLI, configured by [`packages/ui/components.json`](packages/ui/components.json).

## Design system and component customization

- `packages/ui` is the source of truth for the appearance and interaction patterns of shared components.
- Change shared defaults (dimensions, spacing, typography, styling) centrally in `packages/ui`, in the component's implementation, variants, or design tokens, not at call sites.
- Prefer updating an existing variant, or adding a reusable one, over repeating custom classes or styles at call sites.
- Do not add application-specific wrappers, helpers, or CSS overrides just to restyle a shared component.
- Keep shared defaults consistent across Core and modules. For example, the sidebar width is defined once in `packages/ui`, not per application.
- Use existing props and variants for legitimate contextual differences.
- Keep application-specific composition, navigation, state, and business logic in the consuming application.
- Inspect the existing shared component before adding custom styling or new abstractions.

## Licensing and attribution

- Before creating or modifying files, consult [`LICENSES.md`](LICENSES.md) for the applicable licensing, SPDX headers, copyright attribution, and third-party code requirements.
- Follow the policies documented there without duplicating them in this file.

## Implementation discipline

- Inspect the relevant code, configuration, and documentation before editing.
- Keep changes focused on the requested task. Do not modify unrelated files.
- Follow established conventions in the surrounding code.
- Prefer self-documenting code. Comments should explain non-obvious intent, architectural decisions, constraints, or workarounds rather than restating the code.
- Use JSDoc when it adds meaningful information, especially for public APIs. Avoid mechanically documenting every property or function.
- Do not edit generated files by hand. `routeTree.gen.ts` is generated by TanStack Router; `pnpm-lock.yaml` is updated by pnpm.
- Never commit secrets or `.env` files.
- Add or update tests when behavior changes.
- When finishing, report which checks you ran, their results, and any remaining issues or skipped steps.
