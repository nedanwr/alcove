import { Schema } from "effect";

/** A single address, e.g. `"Ada Lovelace" <ada@example.com>`. */
export const Mailbox = Schema.Struct({
  type: Schema.Literal("mailbox"),
  /** Display name with RFC 2047 encoded words decoded. Omitted when empty. */
  name: Schema.optionalKey(Schema.String),
  /** Address as written. Not guaranteed to be valid, see the `invalid-address` issue. */
  address: Schema.String,
});
export type Mailbox = typeof Mailbox.Type;

/** An RFC 5322 group, e.g. `undisclosed-recipients:;`. */
export const AddressGroup = Schema.Struct({
  type: Schema.Literal("group"),
  name: Schema.String,
  members: Schema.Array(Mailbox),
});
export type AddressGroup = typeof AddressGroup.Type;

export const Address = Schema.Union([Mailbox, AddressGroup]);
export type Address = typeof Address.Type;

export const Header = Schema.Struct({
  /** Field name with its original casing. */
  name: Schema.String,
  /** Unfolded field body. Encoded words are not decoded. */
  value: Schema.String,
});
export type Header = typeof Header.Type;

export const Attachment = Schema.Struct({
  /** Decoded file name from Content-Disposition or Content-Type, if the part names one. */
  filename: Schema.optionalKey(Schema.String),
  /** Lowercase MIME type, e.g. `application/pdf`. */
  mimeType: Schema.String,
  /** Lowercase Content-Disposition value, usually `attachment` or `inline`. */
  disposition: Schema.optionalKey(Schema.String),
  /** Content-ID including angle brackets, e.g. `<logo@example.com>`. */
  contentId: Schema.optionalKey(Schema.String),
  /** Decoded Content-Description. */
  description: Schema.optionalKey(Schema.String),
  /** Whether the part is an inline resource of a `multipart/related` HTML body. */
  related: Schema.Boolean,
  /** Uppercase `method` parameter of a calendar part, e.g. `REQUEST`. */
  method: Schema.optionalKey(Schema.String),
  /** Size of `content` in bytes. */
  size: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  /**
   * Content with the transfer encoding removed. Calendar parts (`text/calendar`,
   * `application/ics`) are re-encoded as UTF-8; every other part keeps its bytes.
   */
  content: Schema.Uint8Array,
});
export type Attachment = typeof Attachment.Type;

export const ParseIssueCode = Schema.Literals([
  /** A header section line that is neither a header field nor a continuation. */
  "malformed-header-line",
  /** From or Date, both required by RFC 5322, is absent. */
  "missing-required-header",
  /** A header RFC 5322 allows at most once occurs more than once. */
  "duplicate-header",
  /** The Date header could not be parsed. */
  "invalid-date",
  /** An address has no `@`, e.g. a bare name or an empty `<>`. */
  "invalid-address",
  /** A multipart Content-Type has no boundary; the body was read as text/plain. */
  "multipart-missing-boundary",
  /** No part delimited by the boundary was found; the multipart body was not interpreted. */
  "multipart-without-parts",
  /** The closing boundary delimiter is missing; the message may be truncated. */
  "multipart-unterminated",
  /** The Content-Transfer-Encoding is not supported; the part was kept undecoded. */
  "unknown-transfer-encoding",
  /** The declared charset is not recognised; the text may be decoded incorrectly. */
  "unrecognized-charset",
  /** A text part has 8-bit content but no charset; the charset was guessed. */
  "undeclared-charset",
  /** A nested message exceeded the nesting limit and was kept as an attachment. */
  "nested-message-depth-exceeded",
  /** The MIME structure could not be inspected, so MIME-level issues were not checked. */
  "structure-unavailable",
]);
export type ParseIssueCode = typeof ParseIssueCode.Type;

/**
 * A problem found while parsing that did not prevent a result. The original content is
 * always available in `ParsedEmail.raw`.
 */
export const ParseIssue = Schema.Struct({
  code: ParseIssueCode,
  message: Schema.String,
  /**
   * Position of the MIME part the issue concerns, e.g. `2.1` for the first child of
   * the second top-level part. Omitted when the issue concerns the message itself.
   */
  part: Schema.optionalKey(Schema.String),
});
export type ParseIssue = typeof ParseIssue.Type;

export const ParsedEmail = Schema.Struct({
  /** The original message bytes, exactly as passed to the parser. */
  raw: Schema.Uint8Array,
  /** Every top-level header in document order, duplicates included. */
  headers: Schema.Array(Header),
  messageId: Schema.optionalKey(Schema.String),
  inReplyTo: Schema.optionalKey(Schema.String),
  references: Schema.optionalKey(Schema.String),
  /** Subject with RFC 2047 encoded words decoded. */
  subject: Schema.optionalKey(Schema.String),
  /** Parsed Date header. Omitted when absent or unparseable, see `invalid-date`. */
  date: Schema.optionalKey(Schema.Date),
  /** Every address in the first From header. RFC 5322 permits more than one author. */
  from: Schema.Array(Address),
  sender: Schema.optionalKey(Address),
  replyTo: Schema.Array(Address),
  to: Schema.Array(Address),
  cc: Schema.Array(Address),
  bcc: Schema.Array(Address),
  deliveredTo: Schema.optionalKey(Schema.String),
  returnPath: Schema.optionalKey(Schema.String),
  /** Plain-text body, with line breaks normalised to LF. */
  text: Schema.optionalKey(Schema.String),
  /** HTML body as sent. It is not sanitised. */
  html: Schema.optionalKey(Schema.String),
  attachments: Schema.Array(Attachment),
  issues: Schema.Array(ParseIssue),
});
export type ParsedEmail = typeof ParsedEmail.Type;
