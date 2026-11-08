// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldDescription, FieldError, FieldLabel } from "@alcove/ui/components/ui/field";
import type { ReactNode } from "react";

/**
 * One setting in a section's panel: its first child describes the setting and grows, beside its
 * last child, the control or value. The control wraps below the description when the row can't
 * fit both, rather than overflowing. The children can be any elements, such as `dt` and `dd`.
 */
export function SettingsRow({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="settings-row"
      className="flex min-h-15 flex-wrap items-center gap-4 px-4 py-[13px] *:first:flex *:first:min-w-0 *:first:grow *:first:basis-55 *:first:flex-col *:first:gap-1.5 *:first:text-[13px] *:first:leading-[1.4] *:first:font-medium *:last:max-w-full *:last:min-w-0 *:last:space-y-1.5 *:last:text-[13px] [[data-slot=settings-row]+&]:border-t [[data-slot=settings-row]+&]:border-divider"
    >
      {children}
    </div>
  );
}

type SettingsFieldControlProps = {
  id: string;
  name: string;
  required: true;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

/**
 * A required text input as a settings row, labeled and described beside the input, with its
 * validation error below it. `children` renders the input from the props it's given.
 */
export function SettingsField({
  label,
  name,
  description,
  error,
  children,
}: {
  label: string;
  name: string;
  description?: string;
  error: string | undefined;
  children: (control: SettingsFieldControlProps) => ReactNode;
}) {
  const descriptionId = description ? `${name}-description` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <SettingsRow>
      <div>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      </div>
      <div className="w-75">
        {children({
          id: name,
          name,
          required: true,
          "aria-invalid": error !== undefined,
          "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
        })}
        <FieldError id={errorId}>{error}</FieldError>
      </div>
    </SettingsRow>
  );
}
