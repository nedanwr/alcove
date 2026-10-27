// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Field, FieldDescription, FieldError, FieldLabel } from "@alcove/ui/components/ui/field";
import { Input } from "@alcove/ui/components/ui/input";
import type { ComponentProps } from "react";

/** A labeled, required input that announces its description and validation error. */
export function TextField({
  label,
  name,
  description,
  error,
  ...props
}: Omit<ComponentProps<"input">, "size"> & {
  label: string;
  name: string;
  description?: string;
  error: string | undefined;
}) {
  const descriptionId = description ? `${name}-description` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        size="lg"
        id={name}
        name={name}
        required
        aria-invalid={error !== undefined}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
        {...props}
      />
      {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}
