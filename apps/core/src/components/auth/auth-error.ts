// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

export function authErrorMessage(error: { status: number; message?: string | undefined }) {
  // Email and username sign-in word this differently. Neither says which part was wrong.
  if (error.status === 401) return "Incorrect email, username or password.";
  if (error.status === 429) return "Too many attempts. Wait a moment, then try again.";
  return error.message || "Something went wrong. Try again.";
}
