import { assert, describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { RawEmail } from "postal-mime";
import { vi } from "vitest";

import { parseEmail, UnexpectedParseError } from "../src";
import plainText from "./fixtures/plain-text.eml";

// Simulates postal-mime failing, or changing the internal MIME tree that
// inspectStructure reads.
const mock = vi.hoisted(() => ({ behaviour: "parse" as "parse" | "throw" | "change-structure" }));

vi.mock("postal-mime", async (importOriginal) => {
  const original = await importOriginal<typeof import("postal-mime")>();

  class PostalMime extends original.default {
    override async parse(input: RawEmail) {
      if (mock.behaviour === "throw") throw new TypeError("Something broke");
      const email = await super.parse(input);
      if (mock.behaviour === "change-structure") Object.assign(this, { root: { renamed: true } });
      return email;
    }
  }

  return { ...original, default: PostalMime };
});

describe("unexpected failures", () => {
  it.effect("fails with UnexpectedParseError when the parser throws", () =>
    Effect.gen(function* () {
      mock.behaviour = "throw";

      const error = yield* Effect.flip(parseEmail(plainText));

      assert(error instanceof UnexpectedParseError);
      expect(error.cause).toBeInstanceOf(TypeError);
    }),
  );

  it.effect("reports structure-unavailable when the MIME tree cannot be read", () =>
    Effect.gen(function* () {
      mock.behaviour = "change-structure";

      const email = yield* parseEmail(plainText);

      expect(email.subject).toBe("Hello, 世界 🌍");
      expect(email.issues.map((issue) => issue.code)).toEqual(["structure-unavailable"]);
    }),
  );
});
