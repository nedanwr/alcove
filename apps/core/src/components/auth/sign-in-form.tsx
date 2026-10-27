// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Alert, AlertDescription } from "@alcove/ui/components/ui/alert";
import { Button } from "@alcove/ui/components/ui/button";
import { FieldGroup } from "@alcove/ui/components/ui/field";
import { Spinner } from "@alcove/ui/components/ui/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import { signInSchema } from "~/auth/validation";
import { authErrorMessage } from "~/components/auth/auth-error";
import { AuthPanel } from "~/components/auth/auth-layout";
import { PasswordField } from "~/components/auth/password-field";
import { TextField } from "~/components/auth/text-field";

const fieldNames = ["identifier", "password"] as const;

export function SignInForm({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  // Set only while waiting for the server. TanStack Form's `isSubmitting` also covers validation,
  // and disabling the fields then would stop the first invalid one from receiving focus.
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  const form = useForm({
    defaultValues: { identifier: "", password: "" },
    // Validate on submit, then revalidate each field as it changes.
    validationLogic: revalidateLogic(),
    validators: { onDynamic: signInSchema },
    onSubmitInvalid: ({ formApi }) => {
      const invalid = fieldNames.find((name) => formApi.getFieldMeta(name)?.isValid === false);
      const input = invalid ? formRef.current?.elements.namedItem(invalid) : null;
      if (input instanceof HTMLElement) input.focus();
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        // Validators don't return the schema's output, so parse again to apply its trimming.
        const { identifier, password } = signInSchema.parse(value);
        // Usernames can't contain `@`, so anything with one is an email.
        const { error } = identifier.includes("@")
          ? await authClient.signIn.email({ email: identifier, password })
          : await authClient.signIn.username({ username: identifier, password });
        if (error) {
          setFormError(authErrorMessage(error));
          return;
        }
        await onSignedIn();
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <AuthPanel
      title="Sign in to Alcove"
      description="Enter your email or username and your password."
      note="Need an account? Ask your administrator."
    >
      <form
        ref={formRef}
        noValidate
        aria-busy={submitting}
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(undefined);
          void form.handleSubmit();
        }}
      >
        <fieldset disabled={submitting}>
          <FieldGroup>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <form.Field name="identifier">
              {(field) => (
                <TextField
                  label="Email or username"
                  name={field.name}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  error={field.state.meta.errors[0]?.message}
                />
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <PasswordField
                  label="Password"
                  name={field.name}
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  error={field.state.meta.errors[0]?.message}
                />
              )}
            </form.Field>
            <Button type="submit" size="lg" className="mt-1 w-full">
              {submitting ? <Spinner aria-hidden /> : null}
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </FieldGroup>
        </fieldset>
      </form>
    </AuthPanel>
  );
}
