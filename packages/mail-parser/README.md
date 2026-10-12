# @alcove/mail-parser

RFC 5322 / MIME email parsing for Alcove, built on [postal-mime](https://github.com/postalsys/postal-mime) and [Effect](https://effect.website). It uses only Web APIs, so it runs on Cloudflare Workers without `nodejs_compat`.

```ts
import { parseEmail } from "@alcove/mail-parser";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const email = yield* parseEmail(bytes); // Uint8Array | ArrayBuffer
  email.subject; // decoded subject
  email.raw; // the input bytes, unmodified
  email.issues; // problems the parser worked around
});
```

`parseEmail` returns an `Effect<ParsedEmail, MalformedMessageError | UnexpectedParseError>`. The result types are Effect Schemas (`ParsedEmail`, `Address`, `Attachment`, `ParseIssue`, …), and every result is validated against `ParsedEmail` before it is returned.

## Why postal-mime

- Written for browsers and Workers. It is the parser used in Cloudflare's Email Workers documentation, and it has no dependencies and no Node.js APIs. The tests run it inside workerd.
- Mature and maintained. It comes from the author of Nodemailer and `mailparser`. It handles RFC 2047 encoded words, RFC 2231 parameters, RFC 6532 UTF-8 headers, quoted-printable and base64, `format=flowed`, every WHATWG charset (including Shift_JIS, ISO-2022-JP, GBK and KOI8-R), and nested `message/rfc822` parts.
- Hardened against hostile input, with limits on nesting depth, header size and part count.

Alternatives considered: `mailparser` depends on Node streams and `Buffer`. `emailjs-mime-parser` and `letterparser` are unmaintained.

## Errors and issues

A message only fails to parse if it can't be read as a message at all:

| Error                   | `reason`         | When                                                                        |
| ----------------------- | ---------------- | --------------------------------------------------------------------------- |
| `MalformedMessageError` | `empty`          | The input has no bytes.                                                     |
|                         | `no-headers`     | The header section contains no header field (e.g. plain text, binary data). |
|                         | `limit-exceeded` | More than 256 levels of MIME nesting, 2 MiB of headers, or 10,000 parts.    |
| `UnexpectedParseError`  |                  | Anything else, e.g. a parser bug. `cause` holds the original error.         |

Anything else that is wrong with a message still produces a result. The problem is recorded in `issues` instead of being silently corrected or dropped. Each issue has a `code` (see `ParseIssueCode` in `src/schema.ts`), a message, and, for MIME-level issues, the `part` it concerns. Examples:

- `missing-required-header`, `duplicate-header`, `malformed-header-line`, `invalid-date`, `invalid-address`
- `multipart-without-parts`: no delimiter matches the declared boundary. postal-mime drops such a body, so it is only available in `raw`.
- `multipart-missing-boundary`, `multipart-unterminated` (the message is probably truncated)
- `unrecognized-charset`, `undeclared-charset`: the text was decoded with a guessed charset.
- `unknown-transfer-encoding` (e.g. `x-uuencode`): the content is left undecoded.

postal-mime does not report these cases itself. They are found by inspecting its internal MIME tree (`src/structure.ts`), which is why postal-mime is pinned to an exact version. The tree's shape is validated first. If an upgrade changes it, parsing still succeeds and reports `structure-unavailable`, which the tests catch.

## Limitations

The original bytes are always in `raw`. The structured fields interpret them, and some of that interpretation loses information:

- **Bodies are renderings.** `text` and `html` join every inline text part with a newline and normalise line breaks to LF. When a message has both plain and HTML parts outside a `multipart/alternative`, each body converts the other type to fill gaps. An inline `message/rfc822` part is rendered into the body as a header block and its text, and its attachments are added to `attachments`. Its other headers are not exposed.
- **Only the first occurrence of single-value headers is used.** Address lists (`To`, `Cc`, `Bcc`, `Reply-To`) are combined across duplicates. Both cases are reported as `duplicate-header`.
- **`references` and `inReplyTo` are strings.** They are not split into message IDs.
- **Dates use `Date` parsing.** RFC 5322 dates and common obsolete forms parse. Anything else is reported as `invalid-date`.
- **Charset detection is approximate.** `unrecognized-charset` is reported for labels that `TextDecoder` does not know. postal-mime resolves a few aliases (such as `shift-jis` or `cp932`) itself, so in those cases the issue may be reported even though the text decoded correctly. Raw 8-bit header bytes that are not UTF-8 are read as windows-1252 without an issue.
- **Invalid base64 or quoted-printable is decoded leniently,** without an issue.
- **Calendar attachments** (`text/calendar`, `application/ics`) are re-encoded as UTF-8. All other attachments keep their decoded bytes.
- **MIME issues inside nested messages are not detected.** Parts of an inline `message/rfc822` are parsed separately and are not inspected. Messages nested more than 10 levels deep are kept as attachments (`nested-message-depth-exceeded`).
- **HTML is not sanitised.**
- **Not supported yet:** mbox (a leading `From ` line is reported as `malformed-header-line`), S/MIME and PGP (signed and encrypted parts are kept as attachments), and TNEF (`winmail.dat`).

## Development

```sh
pnpm --filter @alcove/mail-parser test
pnpm --filter @alcove/mail-parser typecheck
```

Tests run inside workerd through `@cloudflare/vitest-plugin`. Fixtures in `test/fixtures` are imported as exact bytes (see `vitest.config.ts`), and `.gitattributes` stops Git from changing their line endings. The Vitest runner itself requires `nodejs_compat`, so the tests can't prove that Node.js APIs are absent. Instead, oxlint rejects Node.js modules and globals in `src`.
