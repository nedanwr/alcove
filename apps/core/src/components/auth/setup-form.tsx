// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Alert, AlertDescription } from "@alcove/ui/components/ui/alert";
import { Button } from "@alcove/ui/components/ui/button";
import { FieldGroup } from "@alcove/ui/components/ui/field";
import { Spinner } from "@alcove/ui/components/ui/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import { passwordLength, setupFormSchema, usernameLength } from "~/auth/validation";
import { authErrorMessage } from "~/components/auth/auth-error";
import { AuthPanel } from "~/components/auth/auth-layout";
import { PasswordField } from "~/components/auth/password-field";
import { PasswordGuidance } from "~/components/auth/password-guidance";
import { TextField } from "~/components/auth/text-field";

const fieldNames = ["name", "username", "email", "password", "confirmPassword"] as const;

type FormError = { message: string; closed: boolean };

export function SetupForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  // Set only while waiting for the server. TanStack Form's `isSubmitting` also covers validation,
  // and disabling the fields then would stop the first invalid one from receiving focus.
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError>();

  const form = useForm({
    defaultValues: { name: "", username: "", email: "", password: "", confirmPassword: "" },
    // Validate on submit, then revalidate each field as it changes.
    validationLogic: revalidateLogic(),
    validators: { onDynamic: setupFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      const invalid = fieldNames.find((name) => formApi.getFieldMeta(name)?.isValid === false);
      const input = invalid ? formRef.current?.elements.namedItem(invalid) : null;
      if (input instanceof HTMLElement) input.focus();
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        // Validators don't return the schema's output, so parse again to trim and normalize.
        const { confirmPassword: _, ...administrator } = setupFormSchema.parse(value);
        const { error } = await authClient.signUp.email(administrator);
        if (error) {
          // Another request may have completed setup first.
          setFormError({ message: authErrorMessage(error), closed: error.status === 403 });
          return;
        }
        await onCreated();
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <AuthPanel
      title="Set up Alcove"
      description="Create the administrator account for this server. This account installs modules, adds people and manages storage."
      note="You can add more people and set up storage after signing in."
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
                <AlertDescription>
                  <p>{formError.message}</p>
                  {formError.closed ? <Link to="/sign-in">Go to sign in</Link> : null}
                </AlertDescription>
              </Alert>
            ) : null}
            <form.Field name="name">
              {(field) => (
                <TextField
                  label="Name"
                  name={field.name}
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  error={field.state.meta.errors[0]?.message}
                />
              )}
            </form.Field>
            <form.Field name="username">
              {(field) => (
                <TextField
                  label="Username"
                  name={field.name}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={usernameLength.max}
                  description="3–32 letters, numbers, periods, underscores or hyphens, starting and ending with a letter or number. You’ll sign in with this or your email."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  error={field.state.meta.errors[0]?.message}
                />
              )}
            </form.Field>
            <form.Field name="email">
              {(field) => (
                <TextField
                  label="Email"
                  name={field.name}
                  type="email"
                  autoComplete="email"
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
                  autoComplete="new-password"
                  maxLength={passwordLength.max}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  error={field.state.meta.errors[0]?.message}
                >
                  <form.Subscribe selector={(state) => state.values}>
                    {({ password, name, username, email }) => (
                      <PasswordGuidance
                        password={password}
                        name={name}
                        username={username}
                        email={email}
                      />
                    )}
                  </form.Subscribe>
                </PasswordField>
              )}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => (
                <TextField
                  label="Confirm password"
                  name={field.name}
                  type="password"
                  autoComplete="new-password"
                  maxLength={passwordLength.max}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  error={field.state.meta.errors[0]?.message}
                />
              )}
            </form.Field>
            <Button type="submit" size="lg" className="mt-1 w-full">
              {submitting ? <Spinner aria-hidden /> : null}
              {submitting ? "Creating account…" : "Create administrator account"}
            </Button>
          </FieldGroup>
        </fieldset>
      </form>
    </AuthPanel>
  );
}
