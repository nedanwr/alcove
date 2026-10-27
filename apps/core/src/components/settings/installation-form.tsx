// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { TextField } from "~/components/auth/text-field";
import {
  FormStatusAlert,
  SettingsSection,
  SubmitButton,
  focusFirstInvalidField,
  settingsErrorMessage,
  type FormStatus,
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
  // Set only while waiting for the server, so the first invalid field can still receive focus.
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>();

  const form = useForm({
    defaultValues: { name },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: installationSettingsSchema },
    onSubmitInvalid: ({ formApi }) =>
      focusFirstInvalidField(
        formRef.current,
        ["name"],
        (field) => formApi.getFieldMeta(field)?.isValid === false,
      ),
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        await updateInstallationSettings({ data: installationSettingsSchema.parse(value) });
        await onSaved();
        setStatus({ variant: "success", message: "The installation was renamed." });
      } catch (error) {
        setStatus({
          variant: "destructive",
          message: settingsErrorMessage(error instanceof Error ? { message: error.message } : {}),
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <SettingsSection
      title="General"
      description="Applies to everyone who uses this server."
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
          <form.Field name="name">
            {(field) => (
              <TextField
                label="Installation name"
                name={field.name}
                autoComplete="off"
                maxLength={installationNameLength.max}
                description="Shown in the sidebar, so people know which server they’re using."
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
