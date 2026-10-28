// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { TextField } from "~/components/auth/text-field";
import { usePendingChanges } from "~/components/settings/settings-changes";
import {
  SettingsSection,
  focusFirstInvalidField,
  settingsErrorMessage,
} from "~/components/settings/settings-section";
import { installationNameLength, installationSettingsSchema } from "~/installation";
import { updateInstallationSettings } from "~/installation.functions";

export function InstallationForm({
  name,
  onSaved,
}: {
  name: string;
  onSaved: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [savedName, setSavedName] = useState(name);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    // From the baseline: the form applies changed defaults on render, and resets to them when untouched.
    defaultValues: { name: savedName },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: installationSettingsSchema },
  });
  const value = useStore(form.store, (state) => state.values.name);
  const invalid = useStore(form.store, (state) => !state.isValid);

  usePendingChanges({
    changes: value === savedName ? 0 : 1,
    invalid,
    appliesToEveryone: true,
    save: async () => {
      await form.handleSubmit();
      if (!form.state.isValid) return { status: "invalid" };
      const settings = installationSettingsSchema.parse(form.state.values);
      setSaving(true);
      try {
        await updateInstallationSettings({ data: settings });
      } catch (error) {
        return {
          status: "failed",
          message: settingsErrorMessage(error instanceof Error ? { message: error.message } : {}),
        };
      } finally {
        setSaving(false);
      }
      setSavedName(settings.name);
      form.reset(settings);
      await onSaved();
      return { status: "saved" };
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
      title="General"
      description="Applies to everyone who uses this server."
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
                label="Installation name"
                name={field.name}
                autoComplete="off"
                maxLength={installationNameLength.max}
                description="Shown in the browser tab, so people know which server they’re using."
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
