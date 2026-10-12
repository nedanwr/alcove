import { Schema } from "effect";

import type { ParseIssue } from "./schema";

/**
 * The parts of postal-mime's MIME tree that the checks below read. postal-mime parses
 * the tree but does not expose it, and silently works around several defects: a
 * multipart without a boundary is read as text/plain, a multipart whose boundary never
 * occurs loses its body, and an unknown charset or transfer encoding falls back to a
 * guess or to the undecoded bytes. Its `root` node is therefore read to report those
 * cases. The node is internal API, so its shape is validated first and the checks are
 * skipped with a `structure-unavailable` issue if a postal-mime release changes it.
 */
interface MimeNode {
  readonly contentType: {
    /** Content-Type header value as written. */
    readonly value: string;
    readonly parsed: { readonly value: string; readonly params: Readonly<Record<string, string>> };
    /** Multipart subtype, or false if the part is not (or is no longer) a multipart. */
    readonly multipart: string | false;
  };
  readonly contentTransferEncoding: { readonly encoding: string };
  readonly contentDisposition: { readonly parsed: { readonly value: string } };
  /** Decoded body. */
  readonly content: ArrayBuffer | null;
  readonly childNodes: ReadonlyArray<MimeNode>;
}

const MimeNode: Schema.Codec<MimeNode> = Schema.Struct({
  contentType: Schema.Struct({
    value: Schema.String,
    parsed: Schema.Struct({
      value: Schema.String,
      params: Schema.Record(Schema.String, Schema.String),
    }),
    multipart: Schema.Union([Schema.String, Schema.Literal(false)]),
  }),
  contentTransferEncoding: Schema.Struct({ encoding: Schema.String }),
  contentDisposition: Schema.Struct({ parsed: Schema.Struct({ value: Schema.String }) }),
  content: Schema.NullOr(Schema.instanceOf(ArrayBuffer)),
  childNodes: Schema.Array(Schema.suspend(() => MimeNode)),
});

const isMimeNode = Schema.is(MimeNode);

// Transfer encodings postal-mime decodes, or that need no decoding. An absent header is
// read as 7bit.
const KNOWN_TRANSFER_ENCODINGS = new Set([
  "",
  "7bit",
  "8bit",
  "binary",
  "base64",
  "quoted-printable",
]);

const textEncoder = new TextEncoder();

/** Reports MIME structure problems that postal-mime works around without telling. */
export function inspectStructure(root: unknown, raw: Uint8Array): ParseIssue[] {
  if (!isMimeNode(root)) {
    return [
      {
        code: "structure-unavailable",
        message:
          "The MIME structure could not be inspected, so MIME-level problems were not checked.",
      },
    ];
  }

  const issues: ParseIssue[] = [];
  walk(root, undefined, raw, issues);
  return issues;
}

function walk(node: MimeNode, part: string | undefined, raw: Uint8Array, issues: ParseIssue[]) {
  const report = (code: ParseIssue["code"], message: string) =>
    issues.push(part === undefined ? { code, message } : { code, message, part });

  const { contentType } = node;
  const boundary = contentType.parsed.params.boundary;

  if (contentType.multipart && boundary) {
    if (node.childNodes.length === 0) {
      report(
        "multipart-without-parts",
        `No part delimited by boundary "${boundary}" was found, so the ${contentType.parsed.value} body was not interpreted.`,
      );
    } else if (!includesBytes(raw, textEncoder.encode(`--${boundary}--`))) {
      report(
        "multipart-unterminated",
        `The closing delimiter for boundary "${boundary}" is missing; the message may be truncated.`,
      );
    }
  } else if (/^\s*multipart\//i.test(contentType.value)) {
    report(
      "multipart-missing-boundary",
      `Content-Type "${contentType.value}" has no boundary, so the body was read as text/plain.`,
    );
  }

  if (node.childNodes.length === 0) {
    inspectLeaf(node, report);
  }

  node.childNodes.forEach((child, index) => {
    walk(child, part === undefined ? `${index + 1}` : `${part}.${index + 1}`, raw, issues);
  });
}

function inspectLeaf(node: MimeNode, report: (code: ParseIssue["code"], message: string) => void) {
  const encoding = node.contentTransferEncoding.encoding;
  if (!KNOWN_TRANSFER_ENCODINGS.has(encoding)) {
    report(
      "unknown-transfer-encoding",
      `Content-Transfer-Encoding "${encoding}" is not supported, so the part content was kept undecoded.`,
    );
  }

  if (!isDecodedAsText(node)) return;

  const charset = node.contentType.parsed.params.charset;
  if (charset) {
    if (!isSupportedCharset(charset)) {
      report(
        "unrecognized-charset",
        `Charset "${charset}" is not a standard encoding label. Unless it is one of the ` +
          `aliases the parser maps (such as "shift-jis" or "cp932"), the text was decoded ` +
          `as UTF-8 or windows-1252 and may be garbled.`,
      );
    }
  } else if (node.content && has8BitBytes(new Uint8Array(node.content))) {
    report(
      "undeclared-charset",
      "The part has 8-bit content but declares no charset. The charset was inferred (from " +
        "an HTML <meta> declaration, valid UTF-8, or a windows-1252 fallback) and the " +
        "text may be garbled.",
    );
  }
}

// The parts postal-mime decodes with their charset: inline text bodies and calendar
// parts. Other text parts are attachments and keep their bytes.
function isDecodedAsText(node: MimeNode): boolean {
  switch (node.contentType.parsed.value) {
    case "text/plain":
    case "text/html":
      return node.contentDisposition.parsed.value !== "attachment";
    case "text/calendar":
    case "application/ics":
      return true;
    default:
      return false;
  }
}

function isSupportedCharset(label: string): boolean {
  try {
    return new TextDecoder(label).encoding !== "";
  } catch {
    return false;
  }
}

function has8BitBytes(bytes: Uint8Array): boolean {
  return bytes.some((byte) => byte >= 0x80);
}

function includesBytes(haystack: Uint8Array, needle: Uint8Array): boolean {
  const first = needle[0];
  const last = haystack.length - needle.length;
  for (let i = haystack.indexOf(first); i !== -1 && i <= last; i = haystack.indexOf(first, i + 1)) {
    let j = 1;
    while (j < needle.length && haystack[i + j] === needle[j]) j++;
    if (j === needle.length) return true;
  }
  return false;
}
