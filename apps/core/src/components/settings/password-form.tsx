// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Field, FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMemo, useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import type { SessionUser } from "~/auth/auth-state";
import { passwordFormSchema, passwordLength } from "~/auth/validation";
import { PasswordField } from "~/components/auth/password-field";
import { PasswordGuidance } from "~/components/auth/password-guidance";
import { TextField } from "~/components/auth/text-field";
import {
  FormStatusAlert,
  SettingsSection,
  SubmitButton,
  focusFirstInvalidField,
  settingsErrorMessage,
  type FormStatus,
} from "~/components/settings/settings-section";

const fieldNames = ["currentPassword", "newPassword", "confirmPassword"] as const;

export function PasswordForm({
  user,
  onChanged,
}: {
  user: SessionUser;
  onChanged: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Set only while waiting for the server, so the first invalid field can still receive focus.
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>();
  const username = user.username ?? "";
  const schema = useMemo(
    () => passwordFormSchema({ username, email: user.email }),
    [username, user.email],
  );

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmitInvalid: ({ formApi }) =>
      focusFirstInvalidField(
        formRef.current,
        fieldNames,
        (field) => formApi.getFieldMeta(field)?.isValid === false,
      ),
    onSubmit: async ({ value, formApi }) => {
      setSubmitting(true);
      try {
        const { currentPassword, newPassword } = schema.parse(value);
        const { error } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });
        if (error) {
          setStatus({ variant: "destructive", message: settingsErrorMessage(error) });
          return;
        }
        formApi.reset();
        setStatus({
          variant: "success",
          message: "Your password was changed, and your other sessions were signed out.",
        });
        await onChanged();
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <SettingsSection
      title="Password"
      description="Changing your password signs you out everywhere else."
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
    >
      <fieldset disabled={submitting}>
        {/* Tells password managers which account the new password belongs to. */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username || user.email}
          readOnly
          hidden
        />
        <FieldGroup>
          <FormStatusAlert status={status} />
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
              />
            )}
          </form.Field>
          <form.Field name="newPassword">
            {(field) => (
              <PasswordField
                label="New password"
                name={field.name}
                autoComplete="new-password"
                maxLength={passwordLength.max}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                error={field.state.meta.errors[0]?.message}
              >
                <PasswordGuidance
                  password={field.state.value}
                  name={user.name}
                  username={username}
                  email={user.email}
                />
              </PasswordField>
            )}
          </form.Field>
          <form.Field name="confirmPassword">
            {(field) => (
              <TextField
                label="Confirm new password"
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
          <Field orientation="horizontal">
            <SubmitButton submitting={submitting} pendingLabel="Changing password…">
              Change password
            </SubmitButton>
          </Field>
        </FieldGroup>
      </fieldset>
    </SettingsSection>
  );
}
