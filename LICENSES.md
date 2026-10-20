# Licensing

Copyright (C) 2026 Naveed Ali Anwar <<alcove@nedanwr.dev>>

Alcove is open source. Alcove's own code uses two licenses:

| License                                     | SPDX identifier | Full text                                            |
| ------------------------------------------- | --------------- | ---------------------------------------------------- |
| GNU Affero General Public License v3.0 only | `AGPL-3.0-only` | [`LICENSE`](LICENSE)                                 |
| Apache License 2.0                          | `Apache-2.0`    | [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt) |

`AGPL-3.0-only` is the repository default. Anything not listed below as `Apache-2.0`, and not listed under [Third-party code](#third-party-code), is licensed under `AGPL-3.0-only`.

This file is a summary. The license texts are authoritative, and nothing here adds to, removes from, or restricts the rights either license grants. In particular, the AGPLv3 permits commercial use, including commercial hosting. Neither license grants rights to the Alcove name or logo.

Premium and commercial Alcove components are licensed separately and maintained outside this repository. Nothing in this repository is proprietary.

## Directory mapping

| Directory                                        | SPDX identifier | Reason                                             |
| ------------------------------------------------ | --------------- | -------------------------------------------------- |
| `apps/core/`                                     | `AGPL-3.0-only` | Alcove Core                                        |
| `apps/controller/`                               | `AGPL-3.0-only` | Alcove Controller                                  |
| `modules/drive/` and other official free modules | `AGPL-3.0-only` | Official free modules                              |
| `packages/module-sdk/`                           | `Apache-2.0`    | Public SDK                                         |
| `packages/plugin-sdk/`                           | `Apache-2.0`    | Public SDK                                         |
| `packages/contracts/`                            | `Apache-2.0`    | Public API contracts                               |
| `templates/`                                     | `Apache-2.0`    | Developer templates                                |
| `examples/`                                      | `Apache-2.0`    | Developer examples                                 |
| `packages/config/`                               | `AGPL-3.0-only` | Internal shared package (see notes)                |
| `packages/database/`                             | `AGPL-3.0-only` | Internal shared package (see notes)                |
| `packages/ui/`                                   | `AGPL-3.0-only` | Internal shared package (see notes)                |
| `tooling/`                                       | `AGPL-3.0-only` | Internal build and development tooling (see notes) |
| `docs/`                                          | `AGPL-3.0-only` | Project documentation (see notes)                  |
| Everything else                                  | `AGPL-3.0-only` | Repository default                                 |

Within any directory, a file's own `SPDX-License-Identifier` header takes precedence. Third-party code keeps its original license and notices; see [Third-party code](#third-party-code).

### Notes on shared directories

`packages/config`, `packages/database`, `packages/ui`, `tooling`, and `docs` use `AGPL-3.0-only`, apart from the third-party code listed under [Third-party code](#third-party-code). At the time of writing, none of them is used by the SDKs, contracts, or templates. Nothing yet requires them to be part of the public, Apache-licensed SDK boundary. Revisit this decision if any of the following become true:

- `packages/ui`**:** the module or plugin SDK needs to expose UI components to extension authors. Those components would need to live in, or be licensed like, the SDK.
- `packages/config`**:** shared configuration (for example TypeScript or lint presets) is referenced by projects generated from `templates/`.
- `tooling`**:** a tool (for example a scaffolding CLI) is published for use outside this repository.
- `docs`**:** documentation includes code meant to be copied into other projects. Put such code in `examples/` (Apache-2.0), or decide on a separate license for documentation.
- `packages/database`**:** types or schemas need to be shared with the SDK or contracts. Define them in `packages/contracts` instead of importing them from here.

## Third-party code

Third-party code keeps its upstream license, copyright notices, and attribution. Exceptions to the directory mapping are listed below. Anything not listed follows the directory mapping. Document new exceptions here before adding the code. A third-party license never applies to other files just because they share a directory.

| Source                                       | Files                                                                                                                                                   | SPDX identifier | License text and notice                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Components, hooks, and utilities in `packages/ui/src/` that are generated by, or derived from, shadcn/ui                                                | `MIT`           | [`LICENSES/MIT.txt`](LICENSES/MIT.txt) |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | `apps/core/src/components/theme-provider.tsx` and `apps/core/src/components/mode-toggle.tsx`, adapted from the shadcn/ui TanStack Start dark mode guide | `MIT`           | [`LICENSES/MIT.txt`](LICENSES/MIT.txt) |

`LICENSES/MIT.txt` is a verbatim copy of the shadcn/ui license, including its upstream notice, `Copyright (c) 2023 shadcn`.

### shadcn/ui-derived code

`packages/ui` contains two kinds of files:

- **shadcn/ui-derived files**: files generated by the shadcn CLI, or copied or adapted from the shadcn/ui repository or registry. These keep the upstream `MIT` license, even without an SPDX header. The `AGPL-3.0-only` mapping for `packages/ui` does not apply to them.
- **Original Alcove files**: everything else, such as Alcove-specific components, hooks, and styles. These are `AGPL-3.0-only` unless this file says otherwise. They are not `MIT` just because they sit next to shadcn/ui-derived files or import them.

For shadcn/ui-derived files:

- **Modifications stay `MIT`.** Alcove-specific changes are licensed under `MIT`, like the rest of the file. This keeps each file under a single license and simplifies upstream updates and reuse. A different license for a specific file needs an explicit maintainer decision recorded in this file.
- **Keep upstream attribution.** Never remove or replace the upstream copyright notice or license identifier.
- **Add an Alcove copyright notice only for copyrightable modifications.** Unmodified files, and files with only non-copyrightable changes (such as formatting, import paths, renames, or small value tweaks), must not receive an Alcove copyright notice. Generating, installing, updating, or copying a file into this repository is not a modification. Copyrightable modifications, such as new behavior, variants, or substantial rewrites, may add a copyright line alongside the upstream one.
- **Do not relicense existing Alcove code by moving it.** Copying existing `AGPL-3.0-only` code into a shadcn/ui-derived file relicenses it under `MIT`. This needs the same review as moving code into an `Apache-2.0` directory (see [Package boundaries](#package-boundaries)).

Headers for shadcn/ui-derived files use the upstream notice and the `MIT` identifier:

```ts
// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-License-Identifier: MIT
```

With a copyrightable modification, add a line without changing the upstream one:

```ts
// SPDX-FileCopyrightText: 2023 shadcn
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: MIT
```

## Package boundaries

The SDKs and contracts are meant to be usable under `Apache-2.0` alone. To keep them that way:

- Apache-2.0 packages must not have runtime or bundled dependencies on `AGPL-3.0-only` packages in this repository.
- AGPL-covered packages may depend on Apache-2.0 packages.
- Code may only be moved or copied from an `AGPL-3.0-only` directory into an `Apache-2.0` directory after a review of who holds the rights to that code, and with their permission where required.

## `package.json` license fields

Each `package.json` declares the SPDX identifier for its directory: `"AGPL-3.0-only"` or `"Apache-2.0"`, as mapped above. The root `package.json` uses `"AGPL-3.0-only"`. Set the field even on private packages.

## Published packages

The license texts live only at the repository root. Any package distributed on its own (for example, published to npm) must include the full text of its license in the distributed artifact:

- `Apache-2.0` packages: include `LICENSES/Apache-2.0.txt`, for example as `LICENSE` in the package root.
- `AGPL-3.0-only` packages: include the root `LICENSE`.
- Packages containing third-party code: also include that code's license text and notices, for example `LICENSES/MIT.txt` for shadcn/ui-derived code.

Projects generated from `templates/` should also receive a copy of the Apache-2.0 text.

## Source file headers

Original, hand-written source files should begin with a short SPDX header matching their directory:

```ts
// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only
```

Use `Apache-2.0` in Apache-licensed directories. Headers are not needed in generated files, lockfiles, JSON, fixtures, or binary assets; those follow the directory mapping above. Never remove existing copyright or license notices.

Third-party-derived files use their upstream license and notice instead of the Alcove header (see [Third-party code](#third-party-code)). Here, "generated files" means build or tool output such as `routeTree.gen.ts`. Code copied in from a third-party source, including through a CLI such as shadcn, is third-party-derived, not generated.

## See also

- [`CONTRIBUTING.md`](.github/CONTRIBUTING.md): contribution licensing and DCO sign-off
- [`DCO`](DCO): Developer Certificate of Origin 1.1
- [`docs/licensing/ci-checks.md`](docs/licensing/ci-checks.md): planned licensing checks
