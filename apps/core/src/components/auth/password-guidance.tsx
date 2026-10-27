// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { CheckIcon, DotIcon } from "lucide-react";

import { estimatePasswordStrength, passwordStrengths } from "~/auth/password-strength";
import { passwordContainsIdentity, passwordLength } from "~/auth/validation";

/**
 * Feedback for a new password: an estimate of its strength, and the requirements the server
 * enforces. The strength is advice only; any password that meets the requirements is accepted.
 */
export function PasswordGuidance({
  password,
  name,
  username,
  email,
}: {
  password: string;
  name: string;
  username: string;
  email: string;
}) {
  const strength = estimatePasswordStrength(password, [
    ...name.split(/\s+/),
    username,
    email.split("@")[0] ?? "",
  ]);
  const level = strength ? passwordStrengths.indexOf(strength) + 1 : 0;
  const requirements = [
    {
      label: `At least ${passwordLength.min} characters`,
      met: password.length >= passwordLength.min,
    },
    {
      label: "Doesn’t contain your username or email",
      met: password.length > 0 && !passwordContainsIdentity(password, { username, email }),
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div aria-hidden className="grid flex-1 grid-cols-4 gap-1">
          {passwordStrengths.map((label, index) => (
            <span
              key={label}
              data-strength={index < level ? strength : undefined}
              className="h-1 rounded-full bg-border data-[strength=Fair]:bg-warning data-[strength=Good]:bg-info data-[strength=Strong]:bg-success data-[strength=Weak]:bg-destructive"
            />
          ))}
        </div>
        <p aria-live="polite" className="w-12 text-right text-xs text-muted-foreground">
          {strength ? (
            <>
              <span className="sr-only">Password strength: </span>
              {strength}
            </>
          ) : null}
        </p>
      </div>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {requirements.map(({ label, met }) => (
          <li
            key={label}
            data-met={met}
            className="flex items-center gap-1.5 data-[met=true]:text-foreground"
          >
            {met ? (
              <CheckIcon aria-hidden className="size-4 shrink-0 text-success" />
            ) : (
              <DotIcon aria-hidden className="size-4 shrink-0" />
            )}
            {label}
            <span className="sr-only">{met ? ", done" : ", not done yet"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
