# Contributing to Alcove

Thanks for your interest in Alcove! Alcove is an open-source project, and bug reports, fixes, documentation, and other improvements are welcome. The maintainers decide what is merged and how the project develops.

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
- Every commit in a pull request needs a sign-off.

To add a missing sign-off:

```sh
git commit --amend --no-edit -s          # last commit only
git rebase --signoff main                # every commit on your branch
git push --force-with-lease
```

## Commit messages

Commit messages follow Alcove's [commit message convention](../docs/contributing/commits.md), which is based on Conventional Commits. Every commit also needs the DCO sign-off described above.

## Commit signing

- **Maintainers** must cryptographically sign their commits (SSH, GPG, or S/MIME) so that GitHub shows them as Verified.
- **Contributors** are encouraged, but not required, to sign their commits.

A cryptographic signature does not replace the DCO sign-off; every commit still needs `Signed-off-by`. For commands and setup, see [Cryptographic Signing](../docs/contributing/commits.md#cryptographic-signing).

## Source file headers

New source files should start with an SPDX header for their directory, as described in [`LICENSES.md`](../LICENSES.md#source-file-headers).

## Before opening a pull request

- [ ] Every commit has a `Signed-off-by` trailer.
- [ ] New source files have the correct SPDX header.
- [ ] New `package.json` files have the correct `license` field.
- [ ] Apache-2.0 packages gain no runtime dependencies on AGPL packages.
- [ ] Any third-party code is identified and its notices are preserved.

Automated checks for these items are planned but not yet in place (see [`docs/licensing/ci-checks.md`](../docs/licensing/ci-checks.md)). Maintainers review them manually for now.
