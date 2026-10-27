// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import { estimatePasswordStrength } from "~/auth/password-strength";

describe("estimatePasswordStrength", () => {
  const personal = ["Ada", "Lovelace", "ada", "lovelace"];

  it("has no estimate for an empty password", () => {
    expect(estimatePasswordStrength("")).toBeUndefined();
  });

  it.each([
    ["repeated characters", "aaaaaaaaaaaa"],
    ["an alphabetical run", "abcdefghijkl"],
    ["a number sequence", "123456789012"],
    ["a keyboard run", "asdfghjklqwe"],
    ["a common password with substitutions", "P@ssw0rd2024!"],
    ["the user's own details", "lovelace1815"],
  ])("rates %s as weak, however long", (_, password) => {
    expect(estimatePasswordStrength(password, personal)).toBe("Weak");
  });

  it("credits a mix of character kinds", () => {
    expect(estimatePasswordStrength("xkqzvbmwtrpl")).toBe("Fair");
    expect(estimatePasswordStrength("k9#Lm2$pQ7!z")).toBe("Good");
  });

  it("rates long, varied passwords and passphrases as strong", () => {
    expect(estimatePasswordStrength("gT7#qL9!vR2@mX4p")).toBe("Strong");
    expect(estimatePasswordStrength("summer is warm and bright")).toBe("Strong");
  });
});
