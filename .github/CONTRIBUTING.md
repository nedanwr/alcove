# Contributing to Alcove

Thanks for your interest in Alcove! Alcove is an open-source project, and bug reports, fixes, documentation, and other improvements are welcome. The maintainers decide what is merged and how the project develops.

## Branches and pull requests

| Branch    | Purpose                            |
| --------- | ---------------------------------- |
| `master`  | Stable, release-ready code         |
| `develop` | Active development and integration |
| `feat/*`  | Feature development                |
| `fix/*`   | Bug fixes                          |
| `chore/*` | Maintenance and infrastructure     |

- Create feature, fix, and maintenance branches from `develop`, for example `feat/core-navigation`.
- Open regular pull requests against `develop`. Only release pull requests, which promote `develop` to a release, target `master`.
- Pull requests are merged with merge commits, so the commits on your branch become part of the project history. Keep them focused and follow the [commit message convention](#commit-messages).
- Every pull request against `develop` or `master` runs three automated checks: `check` (`pnpm check`: formatting, linting, type checking, and tests), `build` (`pnpm build`), and `dco` (sign-offs, see [below](#developer-certificate-of-origin-dco)). They also run for pull requests from forks.

## Licensing of contributions

- **You keep your copyright.** There is no Contributor License Agreement (CLA) and no copyright assignment.
- **Inbound = outbound.** Your contribution is licensed under the license of the files or directory it changes or adds, as mapped in [`LICENSES.md`](../LICENSES.md): `AGPL-3.0-only` by default, or `Apache-2.0` for the SDKs, contracts, templates, and examples.
- **No additional rights.** Contributing does not give Alcove or anyone else the right to relicense your contribution under proprietary or any other terms beyond its open-source license.

### Moving code between licenses

Do not move or copy code from an `AGPL-3.0-only` directory into an `Apache-2.0` package without first opening an issue. Maintainers need to review who holds the rights to that code and obtain any permissions required before it can be relicensed.

### Third-party code

If your contribution includes code you did not write, say so in the pull request. Keep its copyright and license notices intact, and make sure its license allows it to be included in the destination directory, given how the code is used and distributed. Maintainers may ask for details before merging.

## Developer Certificate of Origin (DCO)

Every commit must be signed off under the [Developer Certificate of Origin 1.1](../DCO). By signing off, you certify that you have the right to submit the contribution under the applicable open-source license. This also applies to code produced with the help of tools, including AI assistants.

Sign off by adding a trailer to each commit message. `git commit -s` does this automatically:

```
Signed-off-by: Your Name <you@example.com>
```

- Use your legal name or a consistent pseudonym you are known by, together with a working email address. Anonymous sign-offs are not accepted.
- Every commit in a pull request needs a sign-off. The `dco` check fails if a non-merge commit has no `Signed-off-by` trailer with its author's email address.
- Commits created by Dependabot are exempt, since it cannot sign off. This is an Alcove policy enforced by the `dco` check, not a rule of the DCO itself.

To add a missing sign-off, rewrite the commits on a branch you control, such as your pull request branch. Never rewrite commits on shared or protected branches such as `develop` or `master`.

```sh
git commit --amend --no-edit -s          # last commit only
git rebase --signoff develop             # every commit on your branch
git push --force-with-lease
```

Rebasing or amending signed commits invalidates their existing cryptographic signatures, so maintainers must re-sign them, for example by adding `-S` to the commands above.

### Optional sign-off hook

Alcove provides a Git hook, [`.githooks/prepare-commit-msg`](../.githooks/prepare-commit-msg), that appends the `Signed-off-by` trailer to your commit messages automatically. Using it is optional; the sign-off itself is not. You can always use `git commit -s` instead.

The hook builds the trailer from your configured `user.name` and `user.email`, so check your Git identity before you enable it:

```sh
git config user.name
git config user.email
```

Then enable it from the repository root:

```sh
git config --local core.hooksPath .githooks
```

- Enabling the hook means you agree that every commit it signs off is certified under the DCO, just as if you had added the trailer yourself.
- The hook adds your sign-off to the message's existing trailer block, keeping the rest of the message unchanged, including `BREAKING CHANGE` footers, trailers such as `Co-authored-by`, and other contributors' sign-offs. It skips the commit only if your exact `Signed-off-by` trailer is already present.
- If `user.name` or `user.email` is not set, the hook stops the commit with an error.
- When you write the message in an editor, the sign-off is already in it before you start typing. Put any other trailers, such as `Co-authored-by`, directly above it so they stay in the same trailer block.
- The same setting also enables [`.githooks/pre-commit`](../.githooks/pre-commit), which runs `pnpm pre-commit` to format staged files with Oxfmt and lint staged JavaScript and TypeScript with Oxlint. Fixes are added to the commit, unstaged changes are left alone, and lint errors block the commit. Run `pnpm install` first so the tools are available.
- The hook adds a DCO sign-off only. It does not cryptographically sign commits, so maintainers must still sign theirs as described in [Commit signing](#commit-signing).

## Commit messages

Commit messages follow Alcove's [commit message convention](../docs/contributing/commits.md), which is based on Conventional Commits. Every commit also needs the DCO sign-off described above.

## Commit signing

- **Maintainers** must sign their commits with SSH so that GitHub shows them as Verified.
- **Contributors** are encouraged, but not required, to sign their commits (SSH, GPG, or S/MIME).

A cryptographic signature does not replace the DCO sign-off; every commit still needs `Signed-off-by`. For commands and setup, see [Cryptographic Signing](../docs/contributing/commits.md#cryptographic-signing).

## Source file headers

New source files should start with an SPDX header for their directory, as described in [`LICENSES.md`](../LICENSES.md#source-file-headers).

## Before opening a pull request

- [ ] Every commit has a `Signed-off-by` trailer.
- [ ] New source files have the correct SPDX header.
- [ ] New `package.json` files have the correct `license` field.
- [ ] Apache-2.0 packages gain no runtime dependencies on AGPL packages.
- [ ] Any third-party code is identified and its notices are preserved.

The `dco` check verifies sign-offs automatically. Automated checks for the other items are planned (see [`docs/licensing/ci-checks.md`](../docs/licensing/ci-checks.md)); maintainers review them manually for now.
