// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Badge } from "@alcove/ui/components/ui/badge";
import { ShieldCheckIcon } from "lucide-react";

import type { SessionUser } from "~/auth/auth-state";
import { initials } from "~/components/shell/user-menu";

/** The account's avatar, name, role, and email, as other people on this server see them. */
export function AccountIdentity({
  user,
}: {
  user: Pick<SessionUser, "name" | "email" | "administrator">;
}) {
  return (
    <div data-slot="account-identity" className="flex min-w-0 items-center gap-4">
      <span
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-avatar text-[22px] font-semibold text-avatar-foreground select-none"
      >
        {initials(user.name) || initials(user.email)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 text-[17px] leading-tight font-semibold wrap-anywhere">
            {user.name}
          </p>
          {user.administrator ? (
            <Badge variant="outline">
              <ShieldCheckIcon aria-hidden data-icon="inline-start" />
              Administrator
            </Badge>
          ) : (
            <Badge variant="outline">Member</Badge>
          )}
        </div>
        <p className="min-w-0 text-[13px] text-muted-foreground wrap-anywhere">{user.email}</p>
      </div>
    </div>
  );
}
