// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import { profileFormSchema } from "~/auth/validation";
import { TextField } from "~/components/auth/text-field";
import { usePendingChanges } from "~/components/settings/settings-changes";
import {
  SettingsSection,
  focusFirstInvalidField,
  settingsErrorMessage,
} from "~/components/settings/settings-section";

export function ProfileForm({ name, onSaved }: { name: string; onSaved: () => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [savedName, setSavedName] = useState(name);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    // From the baseline: the form applies changed defaults on render, and resets to them when untouched.
    defaultValues: { name: savedName },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: profileFormSchema },
  });
  const value = useStore(form.store, (state) => state.values.name);
  const invalid = useStore(form.store, (state) => !state.isValid);

  usePendingChanges({
    changes: value === savedName ? 0 : 1,
    invalid,
    save: async () => {
      await form.handleSubmit();
      if (!form.state.isValid) return { status: "invalid" };
      // Validators don't return the schema's output, so parse again to trim.
      const profile = profileFormSchema.parse(form.state.values);
      setSaving(true);
      try {
        const { error } = await authClient.updateUser(profile);
        if (error) return { status: "failed", message: settingsErrorMessage(error) };
        setSavedName(profile.name);
        form.reset(profile);
        await onSaved();
        return { status: "saved" };
      } finally {
        setSaving(false);
      }
    },
    discard: () => form.reset({ name: savedName }),
    focusFirstInvalidField: () =>
      focusFirstInvalidField(
        formRef.current,
        ["name"],
        (field) => form.getFieldMeta(field)?.isValid === false,
      ),
  });

  return (
    <SettingsSection
      title="Profile"
      description="How you appear to other people on this server."
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
        </FieldGroup>
      </fieldset>
    </SettingsSection>
  );
}
