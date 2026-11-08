// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "@alcove/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@alcove/ui/components/ui/dialog";
import { FieldDescription, FieldGroup } from "@alcove/ui/components/ui/field";
import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { useEffect, useMemo, useRef, useState } from "react";

import { authClient } from "~/auth/auth-client";
import type { SessionUser } from "~/auth/auth-state";
import { passwordFormSchema, passwordLength } from "~/auth/validation";
import { PasswordField } from "~/components/auth/password-field";
import { PasswordGuidance } from "~/components/auth/password-guidance";
import { SettingsRow } from "~/components/settings/settings-row";
import {
  FormStatusAlert,
  SettingsSection,
  SubmitButton,
  settingsErrorMessage,
  type FormStatus,
} from "~/components/settings/settings-section";

/**
 * The password row and the dialog that changes it. Changing the password is an action rather than a
 * setting, so it submits from the dialog and never reaches the save ribbon. The form unmounts with
 * the dialog, which discards anything typed into it.
 */
export function PasswordSection({
  user,
  onChanged,
}: {
  user: SessionUser;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>();

  return (
    <>
      <FormStatusAlert status={status} />
      <SettingsSection title="Password">
        <SettingsRow>
          <div>
            <span>Password</span>
            <FieldDescription>Use it with your email or username to sign in.</FieldDescription>
          </div>
          <Dialog
            open={open}
            onOpenChange={(next) => {
              // The request can't be recalled, so stay open to report how it ends.
              if (submitting) return;
              if (next) setStatus(undefined);
              setOpen(next);
            }}
          >
            <DialogTrigger render={<Button variant="secondary" />}>Change password</DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Change password</DialogTitle>
                <DialogDescription>
                  Changing your password signs you out on all your other devices.
                </DialogDescription>
              </DialogHeader>
              <PasswordForm
                user={user}
                submitting={submitting}
                onSubmittingChange={setSubmitting}
                onChanged={async () => {
                  setOpen(false);
                  setStatus({
                    variant: "success",
                    message: "Your password was changed, and your other sessions were signed out.",
                  });
                  await onChanged();
                }}
              />
            </DialogContent>
          </Dialog>
        </SettingsRow>
      </SettingsSection>
    </>
  );
}

function PasswordForm({
  user,
  submitting,
  onSubmittingChange,
  onChanged,
}: {
  user: SessionUser;
  submitting: boolean;
  onSubmittingChange: (submitting: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // A second click can land before the disabled button renders.
  const sending = useRef(false);
  const [status, setStatus] = useState<FormStatus>();
  const username = user.username ?? "";
  const schema = useMemo(
    () => passwordFormSchema({ username, email: user.email }),
    [username, user.email],
  );

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    // The submit button stays disabled until the form is valid, so errors can't wait for a submit.
    validationLogic: revalidateLogic({ mode: "change" }),
    validators: { onDynamic: schema },
    onSubmit: async ({ value, formApi }) => {
      if (sending.current) return;
      sending.current = true;
      onSubmittingChange(true);
      try {
        const { currentPassword, newPassword } = schema.parse(value);
        const { error } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });
        if (error) {
          // Server failures describe the server, not anything the user can act on.
          const message = settingsErrorMessage(error.status >= 500 ? {} : error);
          setStatus({ variant: "destructive", message });
          return;
        }
        formApi.reset();
        await onChanged();
      } catch {
        setStatus({ variant: "destructive", message: settingsErrorMessage({}) });
      } finally {
        sending.current = false;
        onSubmittingChange(false);
      }
    },
  });
  const valid = useStore(form.store, ({ values }) => schema.safeParse(values).success);

  // Disabling the fields while submitting drops focus, so bring it back for another attempt.
  useEffect(() => {
    if (status?.variant !== "destructive") return;
    const input = formRef.current?.elements.namedItem("currentPassword");
    if (input instanceof HTMLElement) input.focus();
  }, [status]);

  return (
    <form
      ref={formRef}
      noValidate
      aria-busy={submitting}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus(undefined);
        void form.handleSubmit();
      }}
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
                error={field.state.meta.isBlurred ? field.state.meta.errors[0]?.message : undefined}
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
                error={field.state.meta.isBlurred ? field.state.meta.errors[0]?.message : undefined}
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
              <PasswordField
                label="Confirm new password"
                name={field.name}
                autoComplete="new-password"
                maxLength={passwordLength.max}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                error={field.state.meta.isBlurred ? field.state.meta.errors[0]?.message : undefined}
              />
            )}
          </form.Field>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <SubmitButton
              submitting={submitting}
              disabled={!valid}
              pendingLabel="Changing password…"
            >
              Change password
            </SubmitButton>
          </DialogFooter>
        </FieldGroup>
      </fieldset>
    </form>
  );
}
