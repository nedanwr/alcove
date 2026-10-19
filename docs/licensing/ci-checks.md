# Planned Licensing Checks

> **Status: planned, not implemented.** No licensing checks run in CI yet. Until they do, maintainers review these items manually.

The following checks are planned to keep the repository consistent with
[`LICENSES.md`](../../LICENSES.md) and [`CONTRIBUTING.md`](../../.github/CONTRIBUTING.md):

1. **DCO sign-off.** Every non-merge commit in a pull request has a `Signed-off-by` trailer. This can be done with an existing DCO GitHub App or a small script.

2. **Maintainer commit signatures.** Commits authored by maintainers carry a valid cryptographic signature (SSH, GPG, or S/MIME). External contributors' commits are not required to be signed and must not fail this check. GitHub's Verified badge alone is not enough: it shows only that the signing key belongs to _some_ GitHub account whose verified email matches the commit, not that the account is an authorized maintainer. Commits created in GitHub's web interface are signed with GitHub's own key. Any enforcement must therefore combine signature verification with an explicit maintainer identity (for example, a list of maintainer accounts and their signing keys) and repository permissions.

3. **SPDX headers and `package.json` licenses.** Source files carry an `SPDX-License-Identifier`, and each `package.json` has a `license` field. Both must match the directory mapping in `LICENSES.md`. The [REUSE](https://reuse.software/) tool is one option, since its `LICENSES/` layout matches this repository.

4. **Workspace license boundaries.** Apache-2.0 packages must not have runtime or bundled dependencies on AGPL-3.0-only workspace packages.

5. **Third-party dependency license review.** Report the licenses of third-party dependencies and flag any that are unknown, missing, or non-open-source for review. An allowlist is a screening aid, not a compatibility ruling. Whether a dependency is compatible depends on how it is used (for example at runtime, when bundled, or as a build-time tool) and how the result is distributed. Flagged cases need human review.

6. **License text integrity.** `LICENSE` and `LICENSES/Apache-2.0.txt` match the canonical texts published by the FSF and the Apache Software Foundation.

7. **Release-time placeholder validation.** Before a release, no `{{PLACEHOLDER}}` values (such as `{{COPYRIGHT_HOLDER}}`) remain, and published packages include their license text.
