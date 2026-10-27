// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

/** Estimated password strengths, from weakest to strongest. */
export const passwordStrengths = ["Weak", "Fair", "Good", "Strong"] as const;

export type PasswordStrength = (typeof passwordStrengths)[number];

// Among the first words attackers try, along with the user's own details.
const commonWords = [
  "password",
  "passwd",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "alcove",
  "login",
  "master",
  "secret",
  "iloveyou",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "shadow",
  "superman",
  "trustno",
  "changeme",
  "default",
  "hello",
  "freedom",
  "whatever",
  "computer",
];

// Neighbours on these rows form predictable runs, such as `abc`, `321`, or `asdf`.
const sequences = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

// Common letter substitutions, so `p4ssw0rd` counts as `password`.
const substitutions: Readonly<Record<string, string>> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

/**
 * Estimates how hard a password is to guess. A heuristic rather than a guarantee: it measures the
 * variety of characters used, but discounts repeated characters, sequences, keyboard runs, common
 * passwords, and the user's own details, which attackers try first.
 *
 * @param personal The user's details, such as their name, username, and email.
 */
export function estimatePasswordStrength(
  password: string,
  personal: readonly string[] = [],
): PasswordStrength | undefined {
  if (!password) return undefined;

  const bits = effectiveLength(password, personal) * Math.log2(characterPool(password));
  if (bits < 40) return "Weak";
  if (bits < 60) return "Fair";
  if (bits < 80) return "Good";
  return "Strong";
}

/** The number of characters an attacker would effectively have to guess. */
function effectiveLength(password: string, personal: readonly string[]) {
  const characters = [...password.toLowerCase()];
  const plain = characters.map((character) => substitutions[character] ?? character);
  const words = [...personal.map((detail) => detail.toLowerCase()), ...commonWords].filter(
    (word) => word.length >= 3,
  );

  // A known word is about as easy to guess as a single character.
  const insideWord = Array.from({ length: characters.length }, () => false);
  for (let index = 0; index < plain.length; index++) {
    for (const word of words) {
      if (plain.slice(index, index + word.length).join("") === word) {
        insideWord.fill(true, index + 1, index + word.length);
      }
    }
  }

  let length = 0;
  for (const [index, character] of characters.entries()) {
    if (insideWord[index]) continue;
    const previous = characters[index - 1];
    const predictable =
      previous !== undefined && (previous === character || areNeighbours(previous, character));
    length += predictable ? 0.25 : 1;
  }
  return length;
}

function areNeighbours(a: string, b: string) {
  return sequences.some((row) => {
    const indexA = row.indexOf(a);
    const indexB = row.indexOf(b);
    return indexA !== -1 && indexB !== -1 && Math.abs(indexA - indexB) === 1;
  });
}

/** How many characters each position could hold, judging by the kinds of characters used. */
function characterPool(password: string) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[ -/:-@[-`{-~]/.test(password)) pool += 33;
  if (/[^\x20-\x7e]/.test(password)) pool += 100;
  return Math.max(pool, 2);
}
