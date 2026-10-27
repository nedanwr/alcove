// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import { passwordLength, signInDetailsFormSchema, usernameLength } from "~/auth/validation";
import { PasswordField } from "~/components/auth/password-field";
import { TextField } from "~/components/auth/text-field";
import {
  FormStatusAlert,
  SettingsSection,
  SubmitButton,
  focusFirstInvalidField,
  settingsErrorMessage,
  type FormStatus,
} from "~/components/settings/settings-section";

const fieldNames = ["username", "email", "currentPassword"] as const;

export function SignInDetailsForm({
  username,
  email,
  onSaved,
}: {
  username: string;
  email: string;
  onSaved: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Set only while waiting for the server, so the first invalid field can still receive focus.
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>();

  const form = useForm({
    defaultValues: { username, email, currentPassword: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: signInDetailsFormSchema },
    onSubmitInvalid: ({ formApi }) =>
      focusFirstInvalidField(
        formRef.current,
        fieldNames,
        (field) => formApi.getFieldMeta(field)?.isValid === false,
      ),
    onSubmit: async ({ value, formApi }) => {
      // Validators don't return the schema's output, so parse again to trim and normalize.
      const details = signInDetailsFormSchema.parse(value);
      const usernameChanged = details.username !== username;
      const emailChanged = details.email.toLowerCase() !== email.toLowerCase();
      if (!usernameChanged && !emailChanged) {
        setStatus({ variant: "destructive", message: "Change your username or email first." });
        return;
      }

      setSubmitting(true);
      const saved: string[] = [];
      // Better Auth's client types don't include the extra field `accountSettings` requires, but
      // it merges `fetchOptions.body` into the request body.
      const reauthentication = { body: { currentPassword: details.currentPassword } };
      try {
        // Two endpoints, so one change can succeed while the other fails. Report both outcomes.
        if (usernameChanged) {
          const { error } = await authClient.updateUser({
            username: details.username,
            fetchOptions: reauthentication,
          });
          if (error) {
            setStatus({ variant: "destructive", message: settingsErrorMessage(error) });
            return;
          }
          saved.push("username");
        }
        if (emailChanged) {
          const { error } = await authClient.changeEmail({
            newEmail: details.email,
            fetchOptions: reauthentication,
          });
          if (error) {
            const message = settingsErrorMessage(error);
            setStatus({
              variant: "destructive",
              message: saved.length
                ? `Your username was updated, but not your email. ${message}`
                : message,
            });
            return;
          }
          saved.push("email");
        }
        formApi.setFieldValue("currentPassword", "");
        setStatus({ variant: "success", message: `Your ${saved.join(" and ")} was updated.` });
      } finally {
        setSubmitting(false);
        // Show the saved details everywhere, including after a partial failure.
        if (saved.length) await onSaved();
      }
    },
  });

  return (
    <SettingsSection
      title="Sign-in details"
      description="You sign in with your username or your email."
      render={
        <form
          ref={formRef}
          noValidate
          aria-busy={submitting}
          onSubmit={(event) => {
            event.preventDefault();
            setStatus(undefined);
            void form.handleSubmit();
          }}
        />
      }
      footer={
        <SubmitButton submitting={submitting} pendingLabel="Saving…">
          Save
        </SubmitButton>
      }
    >
      <fieldset disabled={submitting}>
        <FieldGroup>
          <FormStatusAlert status={status} />
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
                description="3–32 letters, numbers, periods, underscores or hyphens, starting and ending with a letter or number."
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
          <form.Field name="currentPassword">
            {(field) => (
              <PasswordField
                label="Current password"
                name={field.name}
                autoComplete="current-password"
                maxLength={passwordLength.max}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                error={field.state.meta.errors[0]?.message}
              >
                <p className="text-sm text-muted-foreground">
                  Required to change your username or email.
                </p>
              </PasswordField>
            )}
          </form.Field>
        </FieldGroup>
      </fieldset>
    </SettingsSection>
  );
}
