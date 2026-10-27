// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";

import {
  administratorSchema,
  identityMinLength,
  isUsernameValid,
  passwordContainsIdentity,
  safeRedirect,
  setupFormSchema,
  signInSchema,
} from "~/auth/validation";

describe("safeRedirect", () => {
  it.each([
    ["/", "/"],
    ["/drive", "/drive"],
    ["/drive/folder-1?sort=name#top", "/drive/folder-1?sort=name#top"],
    ["/settings/../drive", "/drive"],
  ])("keeps the same-origin path %s", (value, expected) => {
    expect(safeRedirect(value)).toBe(expected);
  });

  it.each([
    ["an absolute URL", "https://evil.example/"],
    ["a protocol-relative URL", "//evil.example/"],
    ["a backslash path", "/\\evil.example/"],
    ["a path broken by a tab", "/\t/evil.example"],
    ["a path broken by a newline", "/\n/evil.example"],
    ["a scheme", "javascript:alert(1)"],
    ["a relative path", "drive"],
    ["an empty string", ""],
    ["a non-string", ["/drive"]],
  ])("drops %s", (_, value) => {
    expect(safeRedirect(value)).toBeUndefined();
  });
});

describe("administratorSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    username: "ada",
    email: "ada@example.com",
    password: "correct horse battery",
  };

  it("trims the name and email", () => {
    expect(
      administratorSchema.parse({ ...valid, name: "  Ada Lovelace ", email: " ada@example.com " }),
    ).toEqual(valid);
  });

  it.each([12, 128])("accepts a %i-character password", (length) => {
    expect(administratorSchema.safeParse({ ...valid, password: "x".repeat(length) }).success).toBe(
      true,
    );
  });

  it("accepts a password containing a username too short to check", () => {
    expect(administratorSchema.safeParse({ ...valid, password: "ada correct horse" }).success).toBe(
      true,
    );
  });

  it("reports a reserved username after normalizing it", () => {
    expect(
      administratorSchema.safeParse({ ...valid, username: "ROOT" }).error?.issues,
    ).toMatchObject([{ path: ["username"], message: "This username is reserved" }]);
  });

  it("stores usernames in lowercase", () => {
    expect(administratorSchema.parse({ ...valid, username: "Ada.Lovelace_1-x" }).username).toBe(
      "ada.lovelace_1-x",
    );
  });

  it.each([
    ["a blank name", { name: "   " }],
    ["an invalid email", { email: "ada" }],
    ["a missing username", { username: undefined }],
    ["a short username", { username: "ad" }],
    ["a long username", { username: "a".repeat(33) }],
    ["a username with spaces", { username: "ada lovelace" }],
    ["a username with an @", { username: "ada@example" }],
    ["a short password", { password: "short" }],
    ["an 11-character password", { password: "x".repeat(11) }],
    ["a 129-character password", { password: "x".repeat(129) }],
    ["a password containing the username", { username: "babbage", password: "my-Babbage-2026" }],
    ["a password containing the email", { password: "ada@example.com!!" }],
    [
      "a password containing the email's local part",
      { email: "lovelace@example.com", password: "LOVELACE engine 1843" },
    ],
    ["an unexpected field", { image: "https://evil.example/tracker.png" }],
  ])("rejects %s", (_, overrides) => {
    expect(administratorSchema.safeParse({ ...valid, ...overrides }).success).toBe(false);
  });
});

describe("isUsernameValid", () => {
  it.each(["ada", "ADA", "a".repeat(32), "ada.lovelace", "ada_l-1843", "a.b.c", "1ada", "ada1"])(
    "accepts %s",
    (value) => {
      expect(isUsernameValid(value)).toBe(true);
    },
  );

  it.each([
    ["too short", "ab"],
    ["too long", "a".repeat(33)],
    ["numeric only", "1843"],
    ["a leading separator", ".ada"],
    ["a trailing separator", "ada-"],
    ["consecutive separators", "ada..lovelace"],
    ["mixed consecutive separators", "ada.-lovelace"],
    ["mixed consecutive separators", "ada_.lovelace"],
    ["whitespace", "ada lovelace"],
    ["an @", "ada@example"],
    ["a non-ASCII letter", "adà"],
    ["a non-ASCII letter that lowercases to ASCII", "\u212Aate"],
    ["another special character", "ada+1"],
    ["a reserved name", "admin"],
    ["a reserved name in uppercase", "Administrator"],
  ])("rejects %s (%s)", (_, value) => {
    expect(isUsernameValid(value)).toBe(false);
  });
});

describe("setupFormSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    username: "ada",
    email: "ada@example.com",
    password: "correct horse battery",
    confirmPassword: "correct horse battery",
  };

  it("requires the passwords to match", () => {
    const result = setupFormSchema.safeParse({ ...valid, confirmPassword: "something else" });

    expect(result.error?.issues).toMatchObject([
      { path: ["confirmPassword"], message: "Passwords don't match" },
    ]);
  });

  it("reports a password containing the username on the password", () => {
    const password = "LOVELACE correct horse";
    const result = setupFormSchema.safeParse({
      ...valid,
      username: "lovelace",
      password,
      confirmPassword: password,
    });

    expect(result.error?.issues).toMatchObject([
      { path: ["password"], message: "Password can't contain your username or email" },
    ]);
  });
});

describe("passwordContainsIdentity", () => {
  const identity = { username: "countess", email: "lovelace@example.com" };

  it.each(["the-COUNTESS-of-1843", "xLoveLacex-1843", "lovelace@example.com123"])(
    "finds the account's details in %s, ignoring case",
    (password) => {
      expect(passwordContainsIdentity(password, identity)).toBe(true);
    },
  );

  it.each(["correct horse battery", "countes lovelac", "Lovelace's engine"])(
    "accepts %s",
    (password) => {
      expect(
        passwordContainsIdentity(password, { username: "babbage", email: "ada@example.com" }),
      ).toBe(false);
    },
  );

  it("ignores identifiers shorter than the minimum", () => {
    // `ada` is a username and local part, but too short to check.
    expect(
      passwordContainsIdentity("Canada geese fly", { username: "ada", email: "ada@x.io" }),
    ).toBe(false);
  });

  it("checks identifiers of exactly the minimum length", () => {
    const minimal = { username: "x".repeat(identityMinLength), email: "ab@example.com" };
    expect(passwordContainsIdentity(`my ${minimal.username} pass`, minimal)).toBe(true);
    expect(passwordContainsIdentity("my xxx pass phrase", minimal)).toBe(false);
  });
});

describe("signInSchema", () => {
  it("trims the email or username", () => {
    expect(signInSchema.parse({ identifier: " ada ", password: "secret" })).toEqual({
      identifier: "ada",
      password: "secret",
    });
  });

  it.each([
    ["a blank identifier", { identifier: "  ", password: "secret" }],
    ["a missing password", { identifier: "ada", password: "" }],
  ])("rejects %s", (_, values) => {
    expect(signInSchema.safeParse(values).success).toBe(false);
  });
});
