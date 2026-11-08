// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@alcove/ui/components/ui/dropdown-menu";
import { Link, useRouter } from "@tanstack/react-router";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useState } from "react";

import { authClient } from "~/auth/auth-client";
import type { SessionUser } from "~/auth/auth-state";
import { ModeToggle } from "~/components/mode-toggle";

/** Up to two initials: the first letters of a name's first and last words. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words.at(-1) ?? "") : "";
  // `Array.from` splits by code point, so a letter outside the BMP stays whole.
  return [first, last]
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

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
      <DropdownMenuTrigger
        aria-label={`Account: ${user.name}`}
        data-slot="user-menu-trigger"
        className="ml-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-avatar text-[12px] font-semibold text-avatar-foreground outline-none select-none hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:transition-[filter]"
      >
        <span aria-hidden>{initials(user.name) || initials(user.email)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-60 rounded-[10px] motion-reduce:animate-none"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm text-foreground">{user.name}</span>
            <span className="truncate font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/settings/account" />}>
          <UserIcon aria-hidden />
          Profile and preferences
        </DropdownMenuItem>
        <ModeToggle />
        <DropdownMenuItem render={<Link to="/settings" />}>
          <SettingsIcon aria-hidden />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onClick={signOut}>
          <LogOutIcon aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
