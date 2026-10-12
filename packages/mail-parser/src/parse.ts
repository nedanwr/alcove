import { Effect, Schema } from "effect";
import PostalMime, { addressParser } from "postal-mime";
import type * as Postal from "postal-mime";

import { MalformedMessageError, UnexpectedParseError } from "./errors";
import {
  ParsedEmail,
  type Address,
  type Attachment,
  type Header,
  type Mailbox,
  type ParseIssue,
} from "./schema";
import { inspectStructure } from "./structure";

/**
 * Parses an RFC 5322 / MIME message.
 *
 * `raw` in the result is the input itself, not a copy: it is never modified, and the
 * caller must not modify it either. Problems the parser can work around are reported in
 * `issues` rather than failing the parse.
 *
 * Fails with `MalformedMessageError` if the input cannot be read as a message at all,
 * and with `UnexpectedParseError` if parsing fails for any other reason.
 */
export const parseEmail = Effect.fn("parseEmail")(function* (input: Uint8Array | ArrayBuffer) {
  const raw = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (raw.byteLength === 0) {
    return yield* new MalformedMessageError({
      reason: "empty",
      message: "The message is empty.",
    });
  }

  const parser = new PostalMime();
  const email = yield* Effect.tryPromise({
    // postal-mime parses a copy of a typed array, so `raw` is never touched.
    try: () => parser.parse(raw),
    catch: (cause) =>
      cause instanceof Error && LIMIT_ERROR.test(cause.message)
        ? new MalformedMessageError({
            reason: "limit-exceeded",
            message: cause.message,
          })
        : new UnexpectedParseError({
            message: "The MIME parser failed.",
            cause,
          }),
  });

  if (!email.headerLines.some((header) => FIELD_START.test(header.line))) {
    return yield* new MalformedMessageError({
      reason: "no-headers",
      message: "The message does not start with a header section.",
    });
  }

  const result = yield* Effect.try({
    // postal-mime keeps its MIME tree on the instance, see inspectStructure.
    try: () => toParsedEmail(raw, email, (parser as { root?: unknown }).root),
    catch: (cause) =>
      new UnexpectedParseError({
        message: "The parser output could not be read.",
        cause,
      }),
  });

  return yield* Schema.decodeUnknownEffect(ParsedEmail)(result).pipe(
    Effect.mapError(
      (cause) =>
        new UnexpectedParseError({
          message: "The parser output does not match the ParsedEmail schema.",
          cause,
        }),
    ),
  );
});

// Errors postal-mime throws when a message exceeds its nesting depth, header size, or
// part count limits.
const LIMIT_ERROR = /^Maximum .+ exceeded$/;

// The start of a header field: printable ASCII other than the colon, then the colon.
const FIELD_START = /^[!-9;-~]+[ \t]*:/;

// Fields RFC 5322 section 3.6 allows at most once.
const SINGLE_FIELDS = [
  "date",
  "from",
  "sender",
  "reply-to",
  "to",
  "cc",
  "bcc",
  "message-id",
  "in-reply-to",
  "references",
  "subject",
];

// Address lists postal-mime combines across duplicate headers.
const LIST_FIELDS = new Set(["reply-to", "to", "cc", "bcc"]);

function toParsedEmail(raw: Uint8Array, email: Postal.Email, root: unknown): ParsedEmail {
  const issues: ParseIssue[] = [];
  const headers: Header[] = email.headers.map((header) => ({
    name: header.originalKey,
    value: header.value,
  }));

  for (const { line } of email.headerLines) {
    if (!FIELD_START.test(line)) {
      issues.push({
        code: "malformed-header-line",
        message: `Header section line is not a header field: ${JSON.stringify(line)}`,
      });
    }
  }

  for (const name of SINGLE_FIELDS) {
    const count = email.headers.filter((header) => header.key === name).length;
    if (count > 1) {
      issues.push({
        code: "duplicate-header",
        message: LIST_FIELDS.has(name)
          ? `The ${name} header occurs ${count} times; their addresses were combined.`
          : `The ${name} header occurs ${count} times; only the first was used.`,
      });
    }
  }

  // postal-mime keeps only the first address of From, which may list several authors.
  const fromHeader = email.headers.find((header) => header.key === "from");
  const from = fromHeader ? addressParser(fromHeader.value).map(toAddress) : [];
  if (!fromHeader) {
    issues.push({
      code: "missing-required-header",
      message: "The From header is missing.",
    });
  }

  let date: Date | undefined;
  if (email.date === undefined) {
    issues.push({
      code: "missing-required-header",
      message: "The Date header is missing.",
    });
  } else {
    // postal-mime returns an ISO string, or the header value if it is not a date.
    date = new Date(email.date);
    if (Number.isNaN(date.getTime())) {
      date = undefined;
      issues.push({
        code: "invalid-date",
        message: `The Date header could not be parsed: ${JSON.stringify(email.date)}`,
      });
    }
  }

  const sender = email.sender && toAddress(email.sender);
  const replyTo = (email.replyTo ?? []).map(toAddress);
  const to = (email.to ?? []).map(toAddress);
  const cc = (email.cc ?? []).map(toAddress);
  const bcc = (email.bcc ?? []).map(toAddress);

  const addressFields: Array<[string, ReadonlyArray<Address>]> = [
    ["From", from],
    ["Sender", sender ? [sender] : []],
    ["Reply-To", replyTo],
    ["To", to],
    ["Cc", cc],
    ["Bcc", bcc],
  ];
  for (const [field, addresses] of addressFields) {
    for (const mailbox of addresses.flatMap(mailboxes)) {
      if (!mailbox.address.includes("@")) {
        issues.push({
          code: "invalid-address",
          message: `The ${field} header contains an invalid address: ${formatMailbox(mailbox)}`,
        });
      }
    }
  }

  const attachments = email.attachments.map(toAttachment);
  for (const attachment of email.attachments) {
    if (attachment.rfc822DepthExceeded) {
      issues.push({
        code: "nested-message-depth-exceeded",
        message:
          "A nested message exceeded the nesting limit, so it was kept as an attachment and its parts were not parsed.",
      });
    }
  }

  issues.push(...inspectStructure(root, raw));

  return {
    raw,
    headers,
    ...optional("messageId", email.messageId),
    ...optional("inReplyTo", email.inReplyTo),
    ...optional("references", email.references),
    ...optional("subject", email.subject),
    ...optional("date", date),
    from,
    ...optional("sender", sender),
    replyTo,
    to,
    cc,
    bcc,
    ...optional("deliveredTo", email.deliveredTo),
    ...optional("returnPath", email.returnPath),
    ...optional("text", email.text),
    ...optional("html", email.html),
    attachments,
    issues,
  };
}

function toMailbox(mailbox: Postal.Mailbox): Mailbox {
  return {
    type: "mailbox",
    ...optional("name", mailbox.name || undefined),
    address: mailbox.address,
  };
}

function toAddress(address: Postal.Address): Address {
  return address.group
    ? {
        type: "group",
        name: address.name,
        members: address.group.map(toMailbox),
      }
    : toMailbox(address);
}

function mailboxes(address: Address): ReadonlyArray<Mailbox> {
  return address.type === "group" ? address.members : [address];
}

function formatMailbox(mailbox: Mailbox): string {
  return mailbox.name === undefined
    ? `<${mailbox.address}>`
    : `${JSON.stringify(mailbox.name)} <${mailbox.address}>`;
}

function toAttachment(attachment: Postal.Attachment): Attachment {
  const { content } = attachment;
  if (typeof content === "string") {
    // Only produced for the base64 and utf8 attachment encodings, which are not used.
    throw new TypeError("Expected binary attachment content.");
  }
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);

  return {
    ...optional("filename", attachment.filename ?? undefined),
    mimeType: attachment.mimeType,
    ...optional("disposition", attachment.disposition ?? undefined),
    ...optional("contentId", attachment.contentId),
    ...optional("description", attachment.description),
    related: attachment.related ?? false,
    ...optional("method", attachment.method),
    size: bytes.byteLength,
    content: bytes,
  };
}

// Builds an optional property, leaving the key out rather than setting it to undefined.
function optional<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}
