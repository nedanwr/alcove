// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import { passwordLength, signInDetailsFormSchema, usernameLength } from "~/auth/validation";
import { PasswordField } from "~/components/auth/password-field";
import { TextField } from "~/components/auth/text-field";
import { usePendingChanges } from "~/components/settings/settings-changes";
import {
  SettingsSection,
  focusFirstInvalidField,
  settingsErrorMessage,
} from "~/components/settings/settings-section";

const fieldNames = ["username", "email", "currentPassword"] as const;

/**
 * The username and email, saved from the page's save ribbon. The current password confirms a save
 * rather than being a setting itself: it never counts as a change, and it is cleared once used.
 */
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
  const [saved, setSaved] = useState({ username, email });
  const [saving, setSaving] = useState(false);

  const form = useForm({
    // From the baseline: the form applies changed defaults on render, and resets to them when untouched.
    defaultValues: { ...saved, currentPassword: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: signInDetailsFormSchema },
  });
  const usernameChanged = useStore(form.store, (state) => state.values.username !== saved.username);
  const emailChanged = useStore(form.store, (state) => state.values.email !== saved.email);
  const invalid = useStore(form.store, (state) => !state.isValid);

  usePendingChanges({
    changes: Number(usernameChanged) + Number(emailChanged),
    invalid,
    save: async () => {
      await form.handleSubmit();
      if (!form.state.isValid) return { status: "invalid" };
      // Validators don't return the schema's output, so parse again to trim and normalize.
      const details = signInDetailsFormSchema.parse(form.state.values);
      // Saved values may differ only in case or spacing, which the server would store unchanged.
      const sendUsername = details.username !== saved.username;
      const sendEmail = details.email.toLowerCase() !== saved.email.toLowerCase();
      const next = { ...saved };
      // Better Auth's client types don't include the extra field `accountSettings` requires, but
      // it merges `fetchOptions.body` into the request body.
      const reauthentication = { body: { currentPassword: details.currentPassword } };

      setSaving(true);
      try {
        // Two endpoints, so one change can succeed while the other fails. Report both outcomes.
        if (sendUsername) {
          const { error } = await authClient.updateUser({
            username: details.username,
            fetchOptions: reauthentication,
          });
          if (error) return { status: "failed", message: settingsErrorMessage(error) };
          next.username = details.username;
        }
        if (sendEmail) {
          const { error } = await authClient.changeEmail({
            newEmail: details.email,
            fetchOptions: reauthentication,
          });
          if (error) {
            const message = settingsErrorMessage(error);
            if (!sendUsername) return { status: "failed", message };
            // The email and current password stay as entered, so saving again retries the email.
            form.setFieldValue("username", next.username);
            return {
              status: "failed",
              message: `Your username was updated, but not your email. ${message}`,
              progress: true,
            };
          }
          next.email = details.email;
        }
        form.reset({ ...next, currentPassword: "" });
        return { status: "saved" };
      } finally {
        setSaved(next);
        setSaving(false);
        // Show the saved details everywhere, including after a partial failure.
        if (next.username !== saved.username || next.email !== saved.email) await onSaved();
      }
    },
    discard: () => form.reset({ ...saved, currentPassword: "" }),
    focusFirstInvalidField: () =>
      focusFirstInvalidField(
        formRef.current,
        fieldNames,
        (field) => form.getFieldMeta(field)?.isValid === false,
      ),
  });

  return (
    <SettingsSection
      title="Sign-in details"
      description="You sign in with your username or your email."
      render={
        <form
          ref={formRef}
          noValidate
          aria-busy={saving}
          onSubmit={(event) => event.preventDefault()}
        />
      }
    >
      <fieldset disabled={saving}>
        <FieldGroup>
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
