// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Input } from "@alcove/ui/components/ui/input";
import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { useMemo, useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import {
  passwordLength,
  personalDetailsFormSchema,
  signInDetailsChanged,
  usernameLength,
} from "~/auth/validation";
import { PasswordInput } from "~/components/auth/password-field";
import { usePendingChanges } from "~/components/settings/settings-changes";
import {
  SettingsSection,
  focusFirstInvalidField,
  settingsErrorMessage,
} from "~/components/settings/settings-section";
import { SettingsField } from "~/components/settings/settings-row";

type PersonalDetails = { name: string; email: string; username: string };
type Detail = keyof PersonalDetails;

const fieldNames = ["name", "email", "username", "currentPassword"] as const;

function listDetails(details: readonly Detail[], conjunction: "and" | "or") {
  if (details.length < 2) return details.join("");
  return `${details.slice(0, -1).join(", ")} ${conjunction} ${details.at(-1)}`;
}

/**
 * The account's name, email, and username, saved from the page's save ribbon. Changing the email or
 * username, which people sign in with, asks for the current password. It confirms a save rather
 * than being a setting itself: it never counts as a change, and it is cleared once used.
 */
export function PersonalDetailsForm({
  details,
  onSaved,
}: {
  details: PersonalDetails;
  onSaved: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(details);
  const [saving, setSaving] = useState(false);
  const schema = useMemo(() => personalDetailsFormSchema(saved), [saved]);

  const form = useForm({
    // From the baseline: the form applies changed defaults on render, and resets to them when untouched.
    defaultValues: { ...saved, currentPassword: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
  });
  const changes = useStore(
    form.store,
    ({ values }) =>
      Number(values.name !== saved.name) +
      Number(values.email !== saved.email) +
      Number(values.username !== saved.username),
  );
  const passwordRequired = useStore(form.store, ({ values }) =>
    signInDetailsChanged(values, saved),
  );
  const invalid = useStore(form.store, (state) => !state.isValid);

  usePendingChanges({
    changes,
    invalid,
    save: async () => {
      await form.handleSubmit();
      if (!form.state.isValid) return { status: "invalid" };
      // Validators don't return the schema's output, so parse again to trim and normalize.
      const values = schema.parse(form.state.values);
      // Better Auth's client types don't include the extra field `accountSettings` requires, but
      // it merges `fetchOptions.body` into the request body.
      const reauthentication = { body: { currentPassword: values.currentPassword } };
      const send = {
        name: () => authClient.updateUser({ name: values.name }),
        username: () =>
          authClient.updateUser({ username: values.username, fetchOptions: reauthentication }),
        email: () =>
          authClient.changeEmail({ newEmail: values.email, fetchOptions: reauthentication }),
      } satisfies Record<Detail, unknown>;
      // Saved values may differ only in case or spacing, which the server would store unchanged.
      const pending = (["name", "username", "email"] as const).filter((detail) =>
        detail === "email"
          ? values.email.toLowerCase() !== saved.email.toLowerCase()
          : values[detail] !== saved[detail],
      );
      const next = { ...saved };
      const updated: Detail[] = [];

      setSaving(true);
      try {
        // One request per detail, so one can succeed while a later one fails. Report both outcomes.
        for (const detail of pending) {
          const { error } = await send[detail]();
          if (error) {
            const message = settingsErrorMessage(error);
            if (updated.length === 0) return { status: "failed", message };
            // Unsaved details and the current password stay as entered, so saving again retries them.
            for (const savedDetail of updated) form.setFieldValue(savedDetail, next[savedDetail]);
            const failed = pending.filter((pendingDetail) => !updated.includes(pendingDetail));
            return {
              status: "failed",
              message: `Your ${listDetails(updated, "and")} ${updated.length === 1 ? "was" : "were"} updated, but not your ${listDetails(failed, "or")}. ${message}`,
              progress: true,
            };
          }
          next[detail] = values[detail];
          updated.push(detail);
        }
        form.reset({ ...next, currentPassword: "" });
        return { status: "saved" };
      } finally {
        setSaved(next);
        setSaving(false);
        // Show the saved details everywhere, including after a partial failure.
        if (updated.length > 0) await onSaved();
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
      title="Personal details"
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
        <form.Field name="name">
          {(field) => (
            <SettingsField
              label="Name"
              name={field.name}
              description="Shown to other people on this server."
              error={field.state.meta.errors[0]?.message}
            >
              {(control) => (
                <Input
                  {...control}
                  variant="ghost"
                  editIcon
                  className="text-end"
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              )}
            </SettingsField>
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <SettingsField
              label="Email"
              name={field.name}
              description="You can sign in with your email or your username."
              error={field.state.meta.errors[0]?.message}
            >
              {(control) => (
                <Input
                  {...control}
                  variant="ghost"
                  editIcon
                  className="text-end"
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              )}
            </SettingsField>
          )}
        </form.Field>
        <form.Field name="username">
          {(field) => (
            <SettingsField
              label="Username"
              name={field.name}
              description="3–32 letters, numbers, periods, underscores or hyphens."
              error={field.state.meta.errors[0]?.message}
            >
              {(control) => (
                <Input
                  {...control}
                  variant="ghost"
                  editIcon
                  className="text-end"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={usernameLength.max}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              )}
            </SettingsField>
          )}
        </form.Field>
        {passwordRequired ? (
          <form.Field name="currentPassword">
            {(field) => (
              <SettingsField
                label="Current password"
                name={field.name}
                description="Required to change your email or username, since you sign in with them."
                error={field.state.meta.errors[0]?.message}
              >
                {(control) => (
                  <PasswordInput
                    {...control}
                    autoComplete="current-password"
                    maxLength={passwordLength.max}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                )}
              </SettingsField>
            )}
          </form.Field>
        ) : null}
      </fieldset>
    </SettingsSection>
  );
}
