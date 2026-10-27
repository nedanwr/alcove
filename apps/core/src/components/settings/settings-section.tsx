// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Alert, AlertDescription } from "@alcove/ui/components/ui/alert";
import { Button } from "@alcove/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@alcove/ui/components/ui/card";
import { Spinner } from "@alcove/ui/components/ui/spinner";
import type { ComponentProps, ReactNode } from "react";

/** Pass a form as `render` to make the section one form. */
export function SettingsSection({
  title,
  description,
  footer,
  children,
  ...props
}: Omit<ComponentProps<typeof Card>, "title"> & {
  title: string;
  description?: string;
  footer?: ReactNode;
}) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle role="heading" aria-level={3}>
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

export function SettingsPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export type FormStatus = { variant: "success" | "destructive"; message: string };

export function FormStatusAlert({ status }: { status: FormStatus | undefined }) {
  if (!status) return null;
  return (
    <Alert variant={status.variant}>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  );
}

export function SubmitButton({
  submitting,
  pendingLabel,
  children,
}: {
  submitting: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <Button type="submit" disabled={submitting}>
      {submitting ? <Spinner aria-hidden /> : null}
      {submitting ? pendingLabel : children}
    </Button>
  );
}

export function focusFirstInvalidField<Name extends string>(
  form: HTMLFormElement | null,
  names: readonly Name[],
  isInvalid: (name: Name) => boolean,
) {
  const invalid = names.find(isInvalid);
  const input = invalid ? form?.elements.namedItem(invalid) : null;
  if (input instanceof HTMLElement) input.focus();
}

export function settingsErrorMessage(error: {
  status?: number | undefined;
  code?: string | undefined;
  message?: string | undefined;
}) {
  if (error.status === 401) return "Your session has ended. Sign in again.";
  if (error.status === 429) return "Too many attempts. Wait a moment, then try again.";
  // Better Auth's own password change words this as "Invalid password".
  if (error.code === "INVALID_PASSWORD") return "Your current password is incorrect.";
  return error.message || "Something went wrong. Try again.";
}
