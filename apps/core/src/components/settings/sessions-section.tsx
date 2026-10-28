// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "@alcove/ui/components/ui/button";
import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { useState } from "react";

import type { AccountSession } from "~/auth/auth-state";
import { revokeOtherSessions, revokeSession } from "~/auth/sessions.functions";
import { DateTime } from "~/components/settings/date-time";
import {
  FormStatusAlert,
  SettingsSection,
  settingsErrorMessage,
  type FormStatus,
} from "~/components/settings/settings-section";
import { describeUserAgent } from "~/components/settings/user-agent";

export function SessionsSection({
  sessions,
  onChanged,
}: {
  sessions: readonly AccountSession[];
  onChanged: () => Promise<void>;
}) {
  // The session being signed out, or "others" for all of them.
  const [pending, setPending] = useState<string>();
  const [status, setStatus] = useState<FormStatus>();
  const others = sessions.filter((session) => !session.current);

  async function run(target: string, action: () => Promise<unknown>, success: string) {
    setPending(target);
    setStatus(undefined);
    try {
      await action();
      await onChanged();
      setStatus({ variant: "success", message: success });
    } catch (error) {
      setStatus({
        variant: "destructive",
        message: settingsErrorMessage(error instanceof Error ? { message: error.message } : {}),
      });
    } finally {
      setPending(undefined);
    }
  }

  return (
    <SettingsSection
      title="Active sessions"
      description="Browsers and devices signed in to your account. Sign out any you don’t recognize, then change your password."
    >
      <div className="flex flex-col gap-3">
        <FormStatusAlert status={status} />
        <ul aria-label="Sessions" className="flex flex-col divide-y divide-divider">
          {sessions.map((session) => {
            const { label, mobile } = describeUserAgent(session.userAgent);
            const Icon = mobile ? SmartphoneIcon : MonitorIcon;
            return (
              <li key={session.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate font-medium">
                    {label}
                    {session.current ? (
                      <span className="ml-2 text-xs font-normal text-success">This session</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.ipAddress ? `${session.ipAddress} · ` : null}
                    Signed in <DateTime value={session.createdAt} />
                    {" · "}
                    Expires <DateTime value={session.expiresAt} dateOnly />
                  </p>
                </div>
                {session.current ? null : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending !== undefined}
                    onClick={() =>
                      run(
                        session.id,
                        () => revokeSession({ data: { id: session.id } }),
                        `${label} was signed out.`,
                      )
                    }
                  >
                    Sign out<span className="sr-only"> {label}</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        <div>
          <Button
            variant="outline"
            disabled={others.length === 0 || pending !== undefined}
            onClick={() =>
              run("others", () => revokeOtherSessions(), "Your other sessions were signed out.")
            }
          >
            Sign out other sessions
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
