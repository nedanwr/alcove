// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "@alcove/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@alcove/ui/components/ui/dropdown-menu";
import { useRouter } from "@tanstack/react-router";
import { CircleUserIcon, LogOutIcon } from "lucide-react";
import { useState } from "react";

import { authClient } from "~/auth/auth-client";
import type { SessionUser } from "~/auth/auth-state";

export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const { error } = await authClient.signOut();
    setSigningOut(false);
    // The session is still valid if sign-out failed, so stay put rather than bounce back here.
    if (error) return;
    // Navigate explicitly, rather than invalidating, so the next person to sign in isn't sent back
    // to this page.
    await router.navigate({ to: "/sign-in", replace: true });
    // The router caches loader data for routes it leaves, including those just left, so clear it
    // only once the navigation has finished.
    router.clearCache();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <CircleUserIcon />
        <span className="sr-only">Account</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm text-foreground">{user.name}</span>
            <span className="truncate font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onClick={signOut}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
