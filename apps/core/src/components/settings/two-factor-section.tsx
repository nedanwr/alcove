// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Badge } from "@alcove/ui/components/ui/badge";
import { FingerprintIcon, KeyRoundIcon, SmartphoneIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SettingsRow } from "~/components/settings/settings-row";
import { SettingsSection } from "~/components/settings/settings-section";

/**
 * Previews the planned two-factor methods. Alcove has no two-factor support yet, so nothing here
 * reads the account or offers an action.
 */
export function TwoFactorSection() {
  return (
    <SettingsSection
      title="Two-factor authentication"
      description="Add another layer of protection to your account with an authenticator app or passkey."
    >
      <SecurityMethod
        icon={SmartphoneIcon}
        title="Authenticator app"
        description="Use a code from an authenticator app when signing in."
      >
        <Badge variant="neutral">Not set up</Badge>
      </SecurityMethod>
      <SecurityMethod
        icon={FingerprintIcon}
        title="Passkeys"
        description="Sign in using your device’s biometrics, PIN, or a security key."
      >
        <Badge variant="neutral">Not available yet</Badge>
      </SecurityMethod>
      <SecurityMethod
        icon={KeyRoundIcon}
        title="Recovery codes"
        description="Backup codes for recovering access when other methods are unavailable."
      >
        <Badge variant="neutral">Not available yet</Badge>
      </SecurityMethod>
      <p className="border-t border-divider px-4 py-3 text-[12.5px] leading-normal text-muted-foreground">
        Two-factor authentication isn’t available in Alcove yet, so these methods can’t be set up.
      </p>
    </SettingsSection>
  );
}

/** One way to verify a sign-in. `children`, such as its status, sit at the end of the row. */
function SecurityMethod({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <SettingsRow>
      <div>
        <div className="flex items-center gap-3.5">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon aria-hidden className="size-[17px]" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[13.5px] font-semibold">{title}</p>
            <p className="text-[12.5px] leading-normal font-normal text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </SettingsRow>
  );
}
