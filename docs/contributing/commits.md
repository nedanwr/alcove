## Git Commit Message Convention

> This is adapted from the [discord.js](https://github.com/discordjs/discord.js) commit convention, which is itself adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular). It is compatible with [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

#### TL;DR:

The header (the first line of the message) must be matched by the following regex, and every commit must be signed off with a `Signed-off-by` trailer (`git commit -s`). Every commit must also be cryptographically signed (see [Cryptographic Signing](#cryptographic-signing)):

```js
/^(?=.{1,72}$)(revert: )?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|types)(\([a-z0-9]+(-[a-z0-9]+)*\))?!?: \S.*$/;
```

#### Examples

Appears under "Features" header, `drive` subheader:

```
feat(drive): add file version history

Signed-off-by: Jane Doe <jane@example.com>
```

Appears under "Bug Fixes" header, `controller` subheader, with a link to issue #28:

```
fix(controller): restart crashed modules correctly

close #28

Signed-off-by: Jane Doe <jane@example.com>
```

Appears under "Performance Improvements" header, and under "Breaking Changes" with the breaking change explanation:

```
perf(core): speed up module loading by removing 'eager' option

BREAKING CHANGE: The 'eager' option has been removed.

Signed-off-by: Jane Doe <jane@example.com>
```

The following commit and commit `667ecc1` do not appear in the changelog if they are under the same release. If not, the revert commit appears under the "Reverts" header.

```
revert: feat(module-sdk): add module lifecycle hooks

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.

Signed-off-by: Jane Doe <jane@example.com>
```

### Full Message Format

A commit message consists of a **header**, **body** and **footer**. The header has a **type**, **scope** and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional. The whole header, including the type, scope, and any `revert: ` prefix, must not exceed **72 characters**. If the commit contains **Breaking Changes**, a `!` can be added before the `:` as an indicator, for example `feat(plugin-sdk)!: rename 'register' hook to 'setup'`.

The **footer** is mandatory because it must contain a `Signed-off-by` trailer (see [Sign-off](#sign-off)).

### Revert

If the commit reverts a previous commit, it should begin with `revert:`, followed by the header of the reverted commit. In the body, it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted. Git's default `Revert "..."` message must be edited to follow this format.

### Type

If the prefix is `feat`, `fix` or `perf`, it will appear in the changelog. However, if there is any [BREAKING CHANGE](#footer), the commit will always appear in the changelog.

Other prefixes are up to your discretion. Suggested prefixes are `docs`, `chore`, `style`, `refactor`, and `test` for non-changelog related tasks.

### Scope

The scope could be anything specifying the place of the commit change. For example `core`, `controller`, `drive`, `module-sdk`, `plugin-sdk`, `contracts`, `ui` etc... Use `repo` for changes that affect the repository as a whole, such as licensing, contribution docs, or root configuration.

Scopes must be lowercase and kebab-case: `module-sdk`, not `moduleSdk`, `ModuleSDK`, or `module_sdk`. Prefer the name of the app, module, or package directory being changed.

### Subject

The subject contains a succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize the first letter
- no dot (.) at the end

### Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes". The body should include the motivation for the change and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

### Sign-off

Every commit must end with a `Signed-off-by` trailer certifying the [Developer Certificate of Origin](../../DCO). `git commit -s` adds it automatically. The requirements for sign-offs, and how to fix a missing one, are described in [`CONTRIBUTING.md`](../../.github/CONTRIBUTING.md#developer-certificate-of-origin-dco).

### Cryptographic Signing

A DCO sign-off and a cryptographic signature are different things:

- **`Signed-off-by` (`-s`)** is a line of text in the commit message. It certifies the DCO. It is **required on every commit**.
- **A cryptographic signature (`-S`)** is attached to the commit object using an SSH, GPG, or S/MIME key. It shows that the commit was created by the holder of that key. It is also **required on every commit**.

A signature never replaces the `Signed-off-by` trailer.

```sh
git commit -S -s -m "feat(drive): add file uploads"
```

To sign automatically, configure your signing key and set `commit.gpgsign`. Despite its name, it applies to all signing formats:

```sh
# SSH
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# GPG
git config --global user.signingkey <key-id>

# S/MIME (requires an X.509 signing tool such as smimesign)
git config --global gpg.format x509
git config --global gpg.x509.program smimesign

# Then, for any format
git config --global commit.gpgsign true
```

`commit.gpgsign` does not add `Signed-off-by`, so keep using `-s`. Git also signs commits it rewrites, for example when amending or rebasing, while `commit.gpgsign` is set.

For GitHub to show your commits as **Verified**, the public key (or, for S/MIME, the certificate's email address) must be associated with your GitHub account, and the commit email must be a verified email on that account. For SSH, add the key to GitHub as a **signing key**, not only as an authentication key. See GitHub's documentation on [signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).
