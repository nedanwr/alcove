// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { requireSignedOut } from "~/auth/auth-state";
import { safeRedirect } from "~/auth/validation";
import { SignInForm } from "~/components/auth/sign-in-form";

export const Route = createFileRoute("/_auth/sign-in")({
  // Where to go after signing in. Anything but a same-origin path is dropped.
  validateSearch: z.object({
    redirect: z.unknown().transform(safeRedirect).optional(),
  }),
  beforeLoad: ({ context, search }) => requireSignedOut(context.auth, search.redirect),
  head: () => ({ meta: [{ title: "Sign in · Alcove" }] }),
  component: SignIn,
});

function SignIn() {
  const router = useRouter();

  return <SignInForm onSignedIn={() => router.invalidate()} />;
}
