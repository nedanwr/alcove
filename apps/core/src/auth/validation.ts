// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod";

// Better Auth enforces the same limits for every password it hashes.
export const passwordLength = { min: 12, max: 128 } as const;

// Better Auth's username plugin enforces the same rules through `isUsernameValid`, and stores and
// looks up usernames in lowercase. Usernames can't contain `@`, so sign-in can tell them apart
// from emails.
export const usernameLength = { min: 3, max: 32 } as const;
export const reservedUsernames: ReadonlySet<string> = new Set([
  "alcove",
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "api",
]);

const username = z
  .string()
  .min(1, "Choose a username")
  .min(usernameLength.min, `Username must be at least ${usernameLength.min} characters`)
  .max(usernameLength.max, `Username must be at most ${usernameLength.max} characters`)
  // Checked before lowercasing, which maps some non-ASCII characters, such as `K` (Kelvin), to ASCII.
  .regex(/^[a-z0-9._-]*$/i, "Use only letters, numbers, periods, underscores and hyphens")
  .regex(/[a-z]/i, "Include at least one letter")
  .regex(/^[a-z0-9](.*[a-z0-9])?$/i, "Start and end with a letter or number")
  .refine((value) => !/[._-]{2}/.test(value), "Don’t put periods, underscores or hyphens together")
  .transform((value) => value.toLowerCase())
  .refine((value) => !reservedUsernames.has(value), "This username is reserved");

/** Whether a username meets the username policy, in any case. */
export function isUsernameValid(value: string) {
  return username.safeParse(value).success;
}

const email = z
  .string()
  .trim()
  .max(254, "Email must be at most 254 characters")
  .pipe(z.email("Enter a valid email address"));

const password = z
  .string()
  .min(passwordLength.min, `Password must be at least ${passwordLength.min} characters`)
  .max(passwordLength.max, `Password must be at most ${passwordLength.max} characters`);

// Shorter identifiers, such as a three-letter username, match too many unrelated passwords.
export const identityMinLength = 4;

/**
 * Whether a password contains the account's username, email address, or the email's local part,
 * ignoring case. Identifiers shorter than `identityMinLength` are ignored.
 */
export function passwordContainsIdentity(
  value: string,
  identity: { username: string; email: string },
) {
  const lowercase = value.toLowerCase();
  const address = identity.email.trim().toLowerCase();
  const localPart = address.split("@")[0] ?? "";
  return [identity.username.toLowerCase(), address, localPart].some(
    (part) => part.length >= identityMinLength && lowercase.includes(part),
  );
}

const administratorFields = z.strictObject({
  name: z.string().trim().min(1, "Enter your name").max(100, "Name must be at most 100 characters"),
  username,
  email,
  password,
});

type AdministratorFields = z.output<typeof administratorFields>;

/** Rejects a password that contains the administrator's username or email. */
export function checkPasswordIdentity(value: AdministratorFields, ctx: z.RefinementCtx) {
  if (passwordContainsIdentity(value.password, value)) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message: "Password can't contain your username or email",
    });
  }
}

/**
 * The initial administrator's details. Validated in the setup form for feedback, and again on the
 * server before Better Auth creates the account.
 */
export const administratorSchema = administratorFields.superRefine(checkPasswordIdentity);

/** The setup form's fields: the administrator's details, and the password again to confirm it. */
export const setupFormSchema = administratorFields
  .extend({ confirmPassword: z.string().min(1, "Confirm your password") })
  .superRefine((value, ctx) => {
    checkPasswordIdentity(value, ctx);
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords don't match" });
    }
  });

/** Sign-in accepts an email or a username, told apart by the `@` that usernames can't contain. */
export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

/**
 * Reduces an untrusted post-sign-in destination to a path on this site, so a crafted link can't
 * redirect elsewhere. Returns `undefined` for anything that isn't a plain same-origin path.
 */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/")) return undefined;
  // Browsers treat protocol-relative (`//host`) and backslash (`/\host`) paths as other origins,
  // and strip control characters, which can turn a path into either.
  if (value.startsWith("//") || value.includes("\\") || hasControlCharacter(value)) {
    return undefined;
  }

  const base = "http://alcove.invalid";
  const url = new URL(value, base);
  if (url.origin !== base) return undefined;

  return `${url.pathname}${url.search}${url.hash}`;
}

function hasControlCharacter(value: string) {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}
