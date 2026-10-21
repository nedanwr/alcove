# Planned Licensing Checks

> **Status: partially implemented.** The DCO sign-off check (1) runs in CI, and a repository ruleset requires verified commit signatures (2). Maintainers review the other items manually until they are automated.

The following checks are planned to keep the repository consistent with
[`LICENSES.md`](../../LICENSES.md) and [`CONTRIBUTING.md`](../../.github/CONTRIBUTING.md):

1. **DCO sign-off.** _Implemented_ by the `dco` job in [`.github/workflows/dco.yml`](../../.github/workflows/dco.yml). Every non-merge commit in a pull request has a `Signed-off-by` trailer for its author's email address. Dependabot commits are exempt; this is an Alcove policy, not a rule of the DCO itself.

2. **Commit signatures.** Every commit has a signature (SSH, GPG, or S/MIME) that GitHub verifies. _Enforced_ by a repository ruleset on all branches, not by CI. Still planned: checking that each commit's `Signed-off-by` identity matches the identity GitHub verified for its signature.

3. **SPDX headers and `package.json` licenses.** Source files carry an `SPDX-License-Identifier`, and each `package.json` has a `license` field. Both must match the directory mapping in `LICENSES.md`. The [REUSE](https://reuse.software/) tool is one option, since its `LICENSES/` layout matches this repository.

4. **Workspace license boundaries.** Apache-2.0 packages must not have runtime or bundled dependencies on AGPL-3.0-only workspace packages.

5. **Third-party dependency license review.** Report the licenses of third-party dependencies and flag any that are unknown, missing, or non-open-source for review. An allowlist is a screening aid, not a compatibility ruling. Whether a dependency is compatible depends on how it is used (for example at runtime, when bundled, or as a build-time tool) and how the result is distributed. Flagged cases need human review.

6. **License text integrity.** `LICENSE` and `LICENSES/Apache-2.0.txt` match the canonical texts published by the FSF and the Apache Software Foundation.

7. **Release-time placeholder validation.** Before a release, no `{{PLACEHOLDER}}` values (such as `{{COPYRIGHT_HOLDER}}`) remain, and published packages include their license text.
