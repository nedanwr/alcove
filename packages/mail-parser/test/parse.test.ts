import { assert, describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { MalformedMessageError, parseEmail, type ParsedEmail } from "../src";
import addressEdgeCases from "./fixtures/address-edge-cases.eml";
import attachments from "./fixtures/attachments.eml";
import boundaryMismatch from "./fixtures/boundary-mismatch.eml";
import empty from "./fixtures/empty.eml";
import forwarded from "./fixtures/forwarded.eml";
import headerProblems from "./fixtures/header-problems.eml";
import invalidDate from "./fixtures/invalid-date.eml";
import legacyCharsets from "./fixtures/legacy-charsets.eml";
import missingBoundary from "./fixtures/missing-boundary.eml";
import missingFrom from "./fixtures/missing-from.eml";
import multipartAlternative from "./fixtures/multipart-alternative.eml";
import noHeaders from "./fixtures/no-headers.eml";
import plainText from "./fixtures/plain-text.eml";
import truncated from "./fixtures/truncated.eml";
import unsupportedEncodings from "./fixtures/unsupported-encodings.eml";
import utf8HeadersLf from "./fixtures/utf8-headers-lf.eml";

const issueCodes = (email: ParsedEmail) => email.issues.map((issue) => issue.code);

const encode = (text: string) => new TextEncoder().encode(text);

const malformed = (input: Uint8Array) =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(parseEmail(input));
    assert(error instanceof MalformedMessageError, `Expected MalformedMessageError, got ${error}`);
    return error;
  });

describe("headers and addresses", () => {
  it.effect("parses the common header fields", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(plainText);

      expect(email.subject).toBe("Hello, 世界 🌍");
      expect(email.date?.toISOString()).toBe("2025-07-01T08:52:37.000Z");
      expect(email.messageId).toBe("<plain-1@example.com>");
      expect(email.inReplyTo).toBe("<parent@example.org>");
      expect(email.references).toBe("<root@example.org> <parent@example.org>");
      expect(email.deliveredTo).toBe("grace@example.org");
      expect(email.returnPath).toBe("ada@example.com");
      expect(email.from).toEqual([
        { type: "mailbox", name: "Lovelace, Ada", address: "ada@example.com" },
      ]);
      expect(email.sender).toEqual({
        type: "mailbox",
        name: "Assistant",
        address: "assistant@example.com",
      });
      expect(email.replyTo).toEqual([{ type: "mailbox", address: "replies@example.com" }]);
      expect(email.to).toEqual([
        { type: "mailbox", name: "Grace Hopper", address: "grace@example.org" },
        { type: "mailbox", address: "alan@example.net" },
      ]);
      expect(email.cc).toEqual([
        { type: "mailbox", name: "René Descartes", address: "rene@example.fr" },
      ]);
      expect(email.bcc).toEqual([]);
      expect(email.issues).toEqual([]);
    }),
  );

  it.effect("keeps every header in order, unfolded but not decoded", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(plainText);

      expect(email.headers.map((header) => header.name)).toEqual([
        "Return-Path",
        "Delivered-To",
        "Received",
        "Message-ID",
        "In-Reply-To",
        "References",
        "Date",
        "From",
        "Sender",
        "Reply-To",
        "To",
        "Cc",
        "Subject",
        "MIME-Version",
        "Content-Type",
        "Content-Transfer-Encoding",
      ]);
      expect(email.headers[2]?.value).toBe(
        "from mail.example.com (mail.example.com [192.0.2.1])\tby mx.example.org with ESMTPS id abc123\tfor <grace@example.org>; Tue, 01 Jul 2025 10:52:37 +0200",
      );
      expect(email.headers[12]).toEqual({
        name: "Subject",
        value: "=?UTF-8?B?SGVsbG8sIOS4lueVjCDwn4yN?=",
      });
    }),
  );

  it.effect("reads raw UTF-8 headers and bare LF line endings", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(utf8HeadersLf);

      expect(email.subject).toBe("Grüße 👋");
      expect(email.from).toEqual([
        { type: "mailbox", name: "Zoë Saldaña", address: "zoe@example.com" },
      ]);
      expect(email.to).toEqual([{ type: "mailbox", name: "田中", address: "tanaka@example.jp" }]);
      expect(email.date?.toISOString()).toBe("2025-07-06T01:45:00.000Z");
      expect(email.text).toBe("Line one.\nLine two.\n");
      expect(email.issues).toEqual([]);
    }),
  );

  it.effect("parses groups and reports invalid addresses", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(addressEdgeCases);

      expect(email.from).toEqual([
        {
          type: "group",
          name: "Team",
          members: [
            { type: "mailbox", address: "alice@example.com" },
            { type: "mailbox", name: "Bob", address: "bob@example.com" },
          ],
        },
      ]);
      expect(email.to).toEqual([{ type: "group", name: "undisclosed-recipients", members: [] }]);
      expect(email.cc).toEqual([
        { type: "mailbox", name: "Not An Address", address: "" },
        { type: "mailbox", address: "" },
        { type: "mailbox", address: "carol@example.com" },
      ]);
      expect(email.bcc).toEqual([
        { type: "mailbox", name: "Quoted, Name", address: "dave@example.com" },
      ]);
      expect(email.issues).toEqual([
        {
          code: "invalid-address",
          message: 'The Cc header contains an invalid address: "Not An Address" <>',
        },
        { code: "invalid-address", message: "The Cc header contains an invalid address: <>" },
      ]);
    }),
  );
});

describe("bodies", () => {
  it.effect("decodes quoted-printable alternatives and ignores the preamble and epilogue", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(multipartAlternative);

      expect(email.text).toBe(
        "Café au lait costs €3. This line is long enough that it has to be soft-wrapped by the encoder.",
      );
      expect(email.html).toBe("<p>Café au lait costs <b>€3</b>.</p>");
      expect(email.attachments).toEqual([]);
      expect(email.issues).toEqual([]);
    }),
  );

  it.effect("decodes legacy charsets in headers and bodies", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(legacyCharsets);

      // ISO-2022-JP subject, ISO-8859-1 and KOI8-R display names.
      expect(email.subject).toBe("挨拶");
      expect(email.from).toEqual([
        { type: "mailbox", name: "Jürgen Müller", address: "juergen@example.de" },
      ]);
      expect(email.to).toEqual([{ type: "mailbox", name: "Иван", address: "ivan@example.ru" }]);
      // ISO-8859-1 8bit, ISO-2022-JP 7bit, and windows-1251 base64 HTML converted to text.
      expect(email.text).toBe(
        "Grüße aus Köln. Ça coûte 5 EUR?\nこんにちは、世界\n\nПривет, мир!\n",
      );
      expect(email.html).toContain("<p>Привет, мир!</p>");
      expect(email.issues).toEqual([]);
    }),
  );

  it.effect("inlines forwarded messages and surfaces their attachments", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(forwarded);

      expect(email.subject).toBe("Fwd: Original");
      expect(email.text).toContain("See the forwarded message below.");
      expect(email.text).toContain("Subject: Original");
      expect(email.text).toContain("Original body.");
      expect(email.attachments).toHaveLength(1);
      expect(email.attachments[0]?.filename).toBe("notes.txt");
      expect(new TextDecoder().decode(email.attachments[0]?.content)).toBe("Nested attachment.");
      expect(email.issues).toEqual([]);
    }),
  );
});

describe("attachments", () => {
  it.effect("decodes attachments and their metadata", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(attachments);

      expect(email.text).toBe("See the attached report.");
      expect(email.html).toBe('<p>See the attached report.</p><img src="cid:logo@example.com">');
      expect(email.issues).toEqual([]);

      const [logo, report, csv, unnamed] = email.attachments;
      expect(email.attachments).toHaveLength(4);

      expect(logo).toMatchObject({
        filename: "logo.png",
        mimeType: "image/png",
        disposition: "inline",
        contentId: "<logo@example.com>",
        related: true,
        size: 70,
      });
      expect(logo?.content.subarray(0, 8)).toEqual(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );

      // RFC 2231 encoded filename and RFC 2047 encoded description.
      expect(report).toMatchObject({
        filename: "résumé — 2025.pdf",
        mimeType: "application/pdf",
        disposition: "attachment",
        description: "Quarterly résumé",
        related: false,
        size: 56,
      });
      expect(report?.content.subarray(0, 13)).toEqual(
        new Uint8Array([
          0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf,
        ]),
      );

      // Text attachments keep their bytes, line endings included.
      expect(csv).toMatchObject({ filename: "data.csv", mimeType: "text/csv", size: 8 });
      expect(new TextDecoder().decode(csv?.content)).toBe("a,b\r\n1,2");

      expect(unnamed).toEqual({
        mimeType: "application/octet-stream",
        related: false,
        size: 6,
        content: new Uint8Array([0, 1, 2, 3, 4, 5]),
      });
    }),
  );
});

describe("raw message", () => {
  it.effect("is the unmodified input", () =>
    Effect.gen(function* () {
      const input = legacyCharsets;
      const copy = input.slice();

      const email = yield* parseEmail(input);

      expect(email.raw).toBe(input);
      expect(input).toEqual(copy);
    }),
  );

  it.effect("wraps an ArrayBuffer input without copying it", () =>
    Effect.gen(function* () {
      const buffer = attachments.slice().buffer;

      const email = yield* parseEmail(buffer);

      expect(email.raw.buffer).toBe(buffer);
      expect(email.raw).toEqual(attachments);
    }),
  );
});

describe("non-conforming messages", () => {
  it.effect("reports malformed header lines, duplicates, and missing headers", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(headerProblems);

      // The first occurrence wins, matching how the MIME headers are resolved.
      expect(email.from).toEqual([{ type: "mailbox", address: "first@example.com" }]);
      expect(email.subject).toBe("First subject");
      expect(email.to).toEqual([{ type: "mailbox", address: "grace@example.org" }]);
      expect(email.text).toBe("Body.\n");
      expect(email.issues).toEqual([
        {
          code: "malformed-header-line",
          message: 'Header section line is not a header field: "This line is not a header"',
        },
        {
          code: "duplicate-header",
          message: "The from header occurs 2 times; only the first was used.",
        },
        {
          code: "duplicate-header",
          message: "The subject header occurs 2 times; only the first was used.",
        },
        { code: "missing-required-header", message: "The Date header is missing." },
      ]);
    }),
  );

  it.effect("reports a missing From header", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(missingFrom);

      expect(email.from).toEqual([]);
      expect(issueCodes(email)).toEqual(["missing-required-header"]);
    }),
  );

  it.effect("reports an unparseable Date and keeps the header value", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(invalidDate);

      expect(email.date).toBeUndefined();
      expect(email.headers).toContainEqual({ name: "Date", value: "the day after tomorrow" });
      expect(issueCodes(email)).toEqual(["invalid-date"]);
    }),
  );

  it.effect("reports a multipart body with no parts matching its boundary", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(boundaryMismatch);

      expect(email.text).toBeUndefined();
      expect(email.issues).toEqual([
        {
          code: "multipart-without-parts",
          message:
            'No part delimited by boundary "declared" was found, so the multipart/mixed body was not interpreted.',
        },
      ]);
    }),
  );

  it.effect("reports a multipart without a boundary and reads it as text", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(missingBoundary);

      expect(email.text).toBe("--whatever\nContent-Type: text/plain\n\nText.\n--whatever--\n");
      expect(issueCodes(email)).toEqual(["multipart-missing-boundary"]);
    }),
  );

  it.effect("reports a truncated multipart and keeps the partial content", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(truncated);

      expect(email.text).toBe("Start of the message.");
      expect(email.attachments).toHaveLength(1);
      expect(email.attachments[0]).toMatchObject({ filename: "cut.pdf", size: 18 });
      expect(issueCodes(email)).toEqual(["multipart-unterminated"]);
    }),
  );

  it.effect("reports charsets and transfer encodings it cannot decode", () =>
    Effect.gen(function* () {
      const email = yield* parseEmail(unsupportedEncodings);

      expect(email.text).toBe(
        "Unknown charset café.\nbegin 644 a.txt\n#86)C\n`\nend\nNo charset naïve.",
      );
      expect(email.issues.map(({ code, part }) => ({ code, part }))).toEqual([
        { code: "unrecognized-charset", part: "1" },
        { code: "unknown-transfer-encoding", part: "2" },
        { code: "undeclared-charset", part: "3" },
      ]);
    }),
  );

  it.effect("keeps messages nested beyond the depth limit as attachments", () =>
    Effect.gen(function* () {
      let message = "From: a@example.com\r\nSubject: Innermost\r\n\r\nInnermost body.\r\n";
      for (let level = 0; level < 12; level++) {
        message = `From: a@example.com\r\nDate: Tue, 01 Jul 2025 10:52:37 +0000\r\nContent-Type: message/rfc822\r\n\r\n${message}`;
      }

      const email = yield* parseEmail(encode(message));

      expect(email.text).not.toContain("Innermost body.");
      expect(email.attachments).toHaveLength(1);
      expect(email.attachments[0]?.mimeType).toBe("message/rfc822");
      expect(issueCodes(email)).toEqual(["nested-message-depth-exceeded"]);
    }),
  );
});

describe("malformed messages", () => {
  it.effect("fails on an empty message", () =>
    Effect.gen(function* () {
      const error = yield* malformed(empty);
      expect(error.reason).toBe("empty");
    }),
  );

  it.effect("fails on input without a header section", () =>
    Effect.gen(function* () {
      const error = yield* malformed(noHeaders);
      expect(error.reason).toBe("no-headers");
    }),
  );

  it.effect("fails on input that is only line breaks", () =>
    Effect.gen(function* () {
      const error = yield* malformed(encode("\r\n\r\n"));
      expect(error.reason).toBe("no-headers");
    }),
  );

  it.effect("fails on a message nested beyond the parser limit", () =>
    Effect.gen(function* () {
      let message = "From: a@example.com\r\nContent-Type: multipart/mixed; boundary=b0\r\n\r\n";
      for (let level = 1; level <= 300; level++) {
        message += `--b${level - 1}\r\nContent-Type: multipart/mixed; boundary=b${level}\r\n\r\n`;
      }

      const error = yield* malformed(encode(message));

      expect(error.reason).toBe("limit-exceeded");
      expect(error.message).toBe("Maximum MIME nesting depth of 256 levels exceeded");
    }),
  );
});
