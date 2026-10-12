import { Schema } from "effect";

/**
 * The input cannot be interpreted as an email message at all. Messages that are merely
 * non-conforming still parse, and report what is wrong with them in `issues`.
 */
export class MalformedMessageError extends Schema.TaggedError<MalformedMessageError>()(
  "MalformedMessageError",
  {
    reason: Schema.Literals([
      /** The input has no bytes. */
      "empty",
      /** The header section contains no header field. */
      "no-headers",
      /** The message exceeds a parser limit on nesting depth, header size, or part count. */
      "limit-exceeded",
    ]),
    message: Schema.String,
  },
) {}

/** The parser failed for a reason unrelated to the message, e.g. a bug. */
export class UnexpectedParseError extends Schema.TaggedError<UnexpectedParseError>()(
  "UnexpectedParseError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}
