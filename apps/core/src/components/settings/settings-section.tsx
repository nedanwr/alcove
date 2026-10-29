// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Alert, AlertDescription } from "@alcove/ui/components/ui/alert";
import { Button } from "@alcove/ui/components/ui/button";
import { Card, CardContent } from "@alcove/ui/components/ui/card";
import { Spinner } from "@alcove/ui/components/ui/spinner";
import { cn } from "@alcove/ui/lib/utils";
import { useId, type ComponentProps, type ReactNode } from "react";

/**
 * A heading and description above the section's panel. Pass a form as `render` to make the panel
 * one form. A panel of `SettingsRow`s drops its own padding, since each row has its own.
 */
export function SettingsSection({
  title,
  description,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Card>, "title"> & {
  title: string;
  description?: string;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <h3 id={titleId} className="text-[15px] leading-[1.4] font-semibold">
          {title}
        </h3>
        {description ? (
          <p className="max-w-[64ch] text-[13px] leading-normal text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Card
        className={cn(
          "has-data-[slot=settings-row]:gap-0 has-data-[slot=settings-row]:py-0",
          className,
        )}
        {...props}
      >
        <CardContent className="has-data-[slot=settings-row]:px-0">{children}</CardContent>
      </Card>
    </section>
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
