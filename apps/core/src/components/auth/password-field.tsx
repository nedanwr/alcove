// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Field, FieldError, FieldLabel } from "@alcove/ui/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@alcove/ui/components/ui/input-group";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

/**
 * A labeled, required password input with a button that shows or hides the password. Anything
 * passed as children, such as password guidance, is shown below the input and announced with it.
 */
export function PasswordField({
  label,
  name,
  error,
  children,
  ...props
}: Omit<ComponentProps<"input">, "type" | "size"> & {
  label: string;
  name: string;
  error: string | undefined;
  children?: ReactNode;
}) {
  const detailsId = children ? `${name}-details` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <PasswordInput
        size="lg"
        id={name}
        name={name}
        required
        aria-invalid={error !== undefined}
        aria-describedby={[detailsId, errorId].filter(Boolean).join(" ") || undefined}
        {...props}
      />
      {children ? <div id={detailsId}>{children}</div> : null}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}

/** A password input with a button that shows or hides the password. */
export function PasswordInput({
  size = "default",
  ...props
}: Omit<ComponentProps<"input">, "type" | "size"> & { size?: "default" | "lg" }) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup size={size}>
      <InputGroupInput type={visible ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label="Show password"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
