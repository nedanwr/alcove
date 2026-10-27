// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import { profileFormSchema } from "~/auth/validation";
import { TextField } from "~/components/auth/text-field";
import {
  FormStatusAlert,
  SettingsSection,
  SubmitButton,
  focusFirstInvalidField,
  settingsErrorMessage,
  type FormStatus,
} from "~/components/settings/settings-section";

export function ProfileForm({ name, onSaved }: { name: string; onSaved: () => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  // Set only while waiting for the server, so the first invalid field can still receive focus.
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>();

  const form = useForm({
    defaultValues: { name },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: profileFormSchema },
    onSubmitInvalid: ({ formApi }) =>
      focusFirstInvalidField(
        formRef.current,
        ["name"],
        (field) => formApi.getFieldMeta(field)?.isValid === false,
      ),
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        // Validators don't return the schema's output, so parse again to trim.
        const profile = profileFormSchema.parse(value);
        const { error } = await authClient.updateUser(profile);
        if (error) {
          setStatus({ variant: "destructive", message: settingsErrorMessage(error) });
          return;
        }
        await onSaved();
        setStatus({ variant: "success", message: "Your name was updated." });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <SettingsSection
      title="Profile"
      description="How you appear to other people on this server."
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
